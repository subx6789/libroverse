import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import userModel from "../user/userModel";
import authorModel from "../author/authorModel";
import { AuthRequest } from "../middlewares/authenticate";
import { config } from "../config/config";

/**
 * Enterprise Stream Upload Helper: Streams raw Buffer directly to Cloudinary
 * avoids saving temporary files to disk on Render / Vercel serverless containers
 */
const uploadStreamToCloudinary = (
  buffer: Buffer,
  options: {
    folder: string;
    resource_type: "image" | "raw" | "auto";
    format?: string;
    flags?: string;
    filename_override?: string;
    quality?: string | number;
    fetch_format?: string;
  }
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Helper to calculate size in MB rounded to 2 decimal places
 */
const bytesToMb = (bytes: number): number => {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
};

/**
 * Create a new eBook with Concurrent Direct In-Memory Buffer Streaming
 */
const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, genre, authorNames } = req.body;

  if (!genre || typeof genre !== "string" || !genre.trim()) {
    return next(createHttpError(400, "At least one category is required to create an eBook"));
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const coverFile = files?.coverImage?.[0] || files?.cover?.[0];
  const pdfFile = files?.file?.[0] || files?.pdf?.[0];

  if (!coverFile || !pdfFile) {
    return next(createHttpError(400, "Both cover image and book PDF file are required"));
  }

  // --- Strict In-Memory Size, Mime-type, and Content Magic Bytes Gate ---
  const validImageMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!validImageMimes.includes(coverFile.mimetype)) {
    return next(createHttpError(400, "Cover must be a valid image (JPEG, PNG, WEBP)"));
  }

  // Magic byte inspection for cover image
  const isJpeg = coverFile.buffer[0] === 0xff && coverFile.buffer[1] === 0xd8 && coverFile.buffer[2] === 0xff;
  const isPng = coverFile.buffer[0] === 0x89 && coverFile.buffer[1] === 0x50 && coverFile.buffer[2] === 0x4e && coverFile.buffer[3] === 0x47;
  const isWebp = coverFile.buffer.toString("ascii", 0, 4) === "RIFF" && coverFile.buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isJpeg && !isPng && !isWebp) {
    return next(createHttpError(400, "Cover image content is invalid or corrupted (failed magic bytes validation)"));
  }

  // Cover image must be <= 3 MB (Cloudinary free tier requirement)
  if (coverFile.size > config.maxImageSizeMb * 1024 * 1024) {
    return next(createHttpError(400, `Cover image size must be ${config.maxImageSizeMb} MB or less`));
  }

  // PDF mime & magic byte inspection (%PDF- = 0x25 0x50 0x44 0x46)
  const isPdfHeader = pdfFile.buffer.length >= 4 && pdfFile.buffer.toString("ascii", 0, 4) === "%PDF";
  if (!isPdfHeader || (pdfFile.mimetype !== "application/pdf" && !pdfFile.originalname.toLowerCase().endsWith(".pdf"))) {
    return next(createHttpError(400, "Book document must be a valid PDF file"));
  }

  // PDF file must be <= 10 MB (Cloudinary free tier requirement)
  if (pdfFile.size > config.maxPdfSizeMb * 1024 * 1024) {
    return next(createHttpError(400, `Book PDF file size must be ${config.maxPdfSizeMb} MB or less`));
  }

  const coverSizeMb = bytesToMb(coverFile.size);
  const pdfSizeMb = bytesToMb(pdfFile.size);

  const _req = req as AuthRequest;
  const currentUserId = new mongoose.Types.ObjectId(_req.userId);

  let uploadResult: any = null;
  let bookFileUploadResult: any = null;
  let createdBookId: any = null;

  try {
    // Resolve standalone Author records for multiple co-authors
    const authorIds: mongoose.Types.ObjectId[] = [];
    if (authorNames) {
      const namesList = Array.isArray(authorNames)
        ? authorNames
        : typeof authorNames === "string"
        ? authorNames.split(",").map((n: string) => n.trim()).filter(Boolean)
        : [];

      for (const name of namesList) {
        let existingAuthor = await authorModel.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (!existingAuthor) {
          existingAuthor = await authorModel.create({ name });
        }
        authorIds.push(new mongoose.Types.ObjectId(existingAuthor._id));
      }
    }

    // --- Concurrent Direct In-Memory Buffer Streaming to Cloudinary ---
    const coverUploadPromise = uploadStreamToCloudinary(coverFile.buffer, {
      folder: "book-covers",
      resource_type: "image",
      quality: "auto:good",
      fetch_format: "auto",
      filename_override: coverFile.originalname,
    });

    const pdfUploadPromise = uploadStreamToCloudinary(pdfFile.buffer, {
      folder: "book-pdfs",
      resource_type: "image",
      format: "pdf",
      flags: "attachment",
      filename_override: pdfFile.originalname,
    });

    // Execute concurrently using Promise.all
    [uploadResult, bookFileUploadResult] = await Promise.all([
      coverUploadPromise,
      pdfUploadPromise,
    ]);

    const coverImageUrl = uploadResult?.secure_url || uploadResult?.url;
    const fileUrl = bookFileUploadResult?.secure_url || bookFileUploadResult?.url;

    if (!coverImageUrl || !fileUrl) {
      throw new Error("Failed to obtain Cloudinary asset URLs from stream");
    }

    // Save eBook with audit metrics and multiple co-authors
    const newBook = await bookModel.create({
      title: title.trim(),
      description: description.trim(),
      genre: genre.trim(),
      author: currentUserId,
      authors: authorIds,
      coverImage: coverImageUrl,
      file: fileUrl,
      pdf_size_mb: pdfSizeMb,
      cover_size_mb: coverSizeMb,
    });

    createdBookId = newBook._id;

    res.status(201).json({ id: newBook._id, pdf_size_mb: pdfSizeMb, cover_size_mb: coverSizeMb });
  } catch (err: any) {
    console.error("Upload failure in createBook - executing rollback:", err);

    // Rollback DB document
    if (createdBookId) {
      try {
        await bookModel.findByIdAndDelete(createdBookId);
      } catch (dbErr) {
        console.error("DB Rollback Error:", dbErr);
      }
    }

    // Rollback Cloudinary cover asset
    if (uploadResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id);
      } catch (cldErr) {
        console.error("Cloudinary Cover Rollback Error:", cldErr);
      }
    }

    // Rollback Cloudinary PDF asset
    if (bookFileUploadResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(bookFileUploadResult.public_id, {
          resource_type: "raw",
        });
      } catch (cldErr) {
        console.error("Cloudinary PDF Rollback Error:", cldErr);
      }
    }

    return next(createHttpError(500, err?.message || "Error while uploading the eBook"));
  }
};

/**
 * Update an existing eBook
 */
const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, genre } = req.body;
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findById(bookId);
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req as AuthRequest;
    const user = await userModel.findById(_req.userId);
    const isAdmin = user?.role === "admin";

    if (book.author.toString() !== _req.userId && !isAdmin) {
      return next(createHttpError(403, "Unauthorized"));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverFile = files?.coverImage?.[0] || files?.cover?.[0];
    const pdfFile = files?.file?.[0] || files?.pdf?.[0];

    let completeCoverImage = book.coverImage;
    let completeFileName = book.file;
    let coverSizeMb = book.pdf_size_mb || 0;
    let pdfSizeMb = book.cover_size_mb || 0;

    // Robust Cloudinary public ID extraction helper
    const getPublicIdFromUrl = (url: string, defaultFolder = "book-pdfs") => {
      try {
        const parts = url.split("/");
        const folderIndex = parts.findIndex((p) => p === defaultFolder || p === "book-covers");
        if (folderIndex !== -1 && folderIndex < parts.length - 1) {
          const pathWithExt = parts.slice(folderIndex).join("/");
          return pathWithExt.replace(/\.[^/.]+$/, "");
        }
        const fileWithExt = parts.at(-1) || "";
        return `${defaultFolder}/${fileWithExt.replace(/\.[^/.]+$/, "")}`;
      } catch {
        return null;
      }
    };

    // Validate size if uploading new cover image (3 MB max)
    if (coverFile) {
      if (coverFile.size > config.maxImageSizeMb * 1024 * 1024) {
        return next(createHttpError(400, `Cover image size must be ${config.maxImageSizeMb} MB or less`));
      }

      // Delete old cover image from Cloudinary if replacing
      if (book.coverImage && book.coverImage.includes("cloudinary")) {
        const oldCoverPublicId = getPublicIdFromUrl(book.coverImage, "book-covers");
        if (oldCoverPublicId) {
          try {
            await cloudinary.uploader.destroy(oldCoverPublicId, { resource_type: "image" });
          } catch (cldErr) {
            console.warn("Could not delete old cover image from Cloudinary:", cldErr);
          }
        }
      }

      const uploadRes = await uploadStreamToCloudinary(coverFile.buffer, {
        folder: "book-covers",
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
        filename_override: coverFile.originalname,
      });
      completeCoverImage = uploadRes.secure_url || uploadRes.url;
      coverSizeMb = bytesToMb(coverFile.size);
    }

    // Validate size if uploading new PDF file (10 MB max)
    if (pdfFile) {
      if (pdfFile.size > config.maxPdfSizeMb * 1024 * 1024) {
        return next(createHttpError(400, `Book PDF must be ${config.maxPdfSizeMb} MB or less`));
      }

      // Delete old PDF from Cloudinary if replacing
      if (book.file && book.file.includes("cloudinary")) {
        const oldPdfPublicId = getPublicIdFromUrl(book.file, "book-pdfs");
        if (oldPdfPublicId) {
          try {
            await Promise.allSettled([
              cloudinary.uploader.destroy(oldPdfPublicId, { resource_type: "image" }),
              cloudinary.uploader.destroy(oldPdfPublicId, { resource_type: "raw" }),
              cloudinary.uploader.destroy(`${oldPdfPublicId}.pdf`, { resource_type: "raw" }),
            ]);
          } catch (cldErr) {
            console.warn("Could not delete old PDF document from Cloudinary:", cldErr);
          }
        }
      }

      const uploadPdfRes = await uploadStreamToCloudinary(pdfFile.buffer, {
        folder: "book-pdfs",
        resource_type: "image",
        format: "pdf",
        flags: "attachment",
        filename_override: pdfFile.originalname,
      });
      completeFileName = uploadPdfRes.secure_url || uploadPdfRes.url;
      pdfSizeMb = bytesToMb(pdfFile.size);
    }

    // Resolve standalone Author records for multiple co-authors
    let authorIds = book.authors || [];
    if (req.body.authorNames !== undefined) {
      const namesList = Array.isArray(req.body.authorNames)
        ? req.body.authorNames
        : typeof req.body.authorNames === "string"
        ? req.body.authorNames.split(",").map((n: string) => n.trim()).filter(Boolean)
        : [];

      const newAuthorIds: mongoose.Types.ObjectId[] = [];
      for (const name of namesList) {
        let existingAuthor = await authorModel.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (!existingAuthor) {
          existingAuthor = await authorModel.create({ name });
        }
        newAuthorIds.push(new mongoose.Types.ObjectId(existingAuthor._id));
      }
      authorIds = newAuthorIds as any;
    }

    const updatedBook = await bookModel
      .findOneAndUpdate(
        { _id: bookId },
        {
          title: title ? title.trim() : book.title,
          description: description ? description.trim() : book.description,
          genre: genre ? genre.trim() : book.genre,
          authors: authorIds,
          coverImage: completeCoverImage,
          file: completeFileName,
          cover_size_mb: coverSizeMb,
          pdf_size_mb: pdfSizeMb,
        },
        { new: true }
      )
      .populate("author", "name email role")
      .populate("authors", "name bio avatar_url");

    res.json(updatedBook);
  } catch (err: any) {
    return next(createHttpError(500, err?.message || "Error while updating the eBook"));
  }
};

/**
 * List all eBooks
 */
const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await bookModel
      .find()
      .populate("author", "name email role")
      .populate("authors", "name bio avatar_url")
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    return next(createHttpError(500, "Error while getting all books"));
  }
};

/**
 * Get a single eBook by ID
 */
const getSingleBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  if (!bookId) {
    return next(createHttpError(400, "Book ID is required"));
  }

  try {
    const book = await bookModel
      .findById(bookId)
      .populate("author", "name email role")
      .populate("authors", "name bio avatar_url");
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    res.json(book);
  } catch (err) {
    next(createHttpError(500, "Error while getting the book"));
  }
};

/**
 * Delete an eBook (Author or Admin)
 */
const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  if (!bookId) {
    return next(createHttpError(400, "Book ID is required"));
  }

  try {
    const book = await bookModel.findById(bookId);
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req as AuthRequest;
    const user = await userModel.findById(_req.userId);
    const isAdmin = user?.role === "admin";

    if (book.author.toString() !== _req.userId && !isAdmin) {
      return next(createHttpError(403, "Unauthorized"));
    }

    const getPublicIdFromUrl = (url: string, defaultFolder = "book-pdfs") => {
      try {
        const parts = url.split("/");
        const folderIndex = parts.findIndex((p) => p === defaultFolder || p === "book-covers");
        if (folderIndex !== -1 && folderIndex < parts.length - 1) {
          const pathWithExt = parts.slice(folderIndex).join("/");
          return pathWithExt.replace(/\.[^/.]+$/, "");
        }
        const fileWithExt = parts.at(-1) || "";
        return `${defaultFolder}/${fileWithExt.replace(/\.[^/.]+$/, "")}`;
      } catch {
        return null;
      }
    };

    const coverImagePublicId = getPublicIdFromUrl(book.coverImage, "book-covers");
    const bookFilePublicId = getPublicIdFromUrl(book.file, "book-pdfs");

    try {
      const deletePromises: Promise<any>[] = [];
      if (coverImagePublicId) {
        deletePromises.push(cloudinary.uploader.destroy(coverImagePublicId));
      }
      if (bookFilePublicId) {
        deletePromises.push(cloudinary.uploader.destroy(bookFilePublicId, { resource_type: "image" }));
        deletePromises.push(cloudinary.uploader.destroy(bookFilePublicId, { resource_type: "raw" }));
        deletePromises.push(cloudinary.uploader.destroy(`${bookFilePublicId}.pdf`, { resource_type: "raw" }));
      }
      await Promise.allSettled(deletePromises);
    } catch (destroyErr) {
      console.warn("Could not delete file from Cloudinary:", destroyErr);
    }

    await bookModel.findByIdAndDelete(bookId);
    res.sendStatus(204);
  } catch (err) {
    next(createHttpError(500, "Error while deleting the book"));
  }
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
