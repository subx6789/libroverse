import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon, FileText, Loader2, Sparkles, FolderPlus } from 'lucide-react';
import { useBookStore } from '../../store/useBookStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useToast } from '../ui/ToastContext';
import type { Book } from '../../types';
import { compressImage, compressPdf } from '../../utils/mediaCompressor';
import { CompressionStatsBadge } from '../ui/CompressionStatsBadge';

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: Book | null;
}

export const BookUploadModal: React.FC<BookUploadModalProps> = ({
  isOpen,
  onClose,
  bookToEdit,
}) => {
  const { createBook, updateBook, isSubmitting } = useBookStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { showToast } = useToast();

  const initialAuthors = bookToEdit?.authors && bookToEdit.authors.length > 0
    ? bookToEdit.authors.map((a) => a.name).join(', ')
    : (typeof bookToEdit?.author === 'object' && bookToEdit?.author?.name ? bookToEdit.author.name : '');

  const [title, setTitle] = useState(bookToEdit?.title || '');
  const [authorNames, setAuthorNames] = useState(initialAuthors);
  const [description, setDescription] = useState(bookToEdit?.description || '');
  const [genre, setGenre] = useState(bookToEdit?.genre || (categories[0]?.name || ''));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(bookToEdit?.coverImage || '');

  const [coverStats, setCoverStats] = useState<any | null>(null);
  const [isCompressingCover, setIsCompressingCover] = useState(false);
  const [bookStats, setBookStats] = useState<any | null>(null);
  const [isCompressingBook, setIsCompressingBook] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevBook, setPrevBook] = useState(bookToEdit);

  if (isOpen !== prevOpen || bookToEdit !== prevBook) {
    setPrevOpen(isOpen);
    setPrevBook(bookToEdit);
    setTitle(bookToEdit?.title || '');
    const currentAuthors = bookToEdit?.authors && bookToEdit.authors.length > 0
      ? bookToEdit.authors.map((a) => a.name).join(', ')
      : (typeof bookToEdit?.author === 'object' && bookToEdit?.author?.name ? bookToEdit.author.name : '');
    setAuthorNames(currentAuthors);
    setDescription(bookToEdit?.description || '');
    setGenre(bookToEdit?.genre || (categories[0]?.name || ''));
    setCoverPreview(bookToEdit?.coverImage || '');
    setCoverFile(null);
    setBookFile(null);
    setCoverStats(null);
    setBookStats(null);
  }

  if (!isOpen) return null;

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        showToast('Cover image exceeds 3 MB limit (Cloudinary free tier).', 'error');
        e.target.value = '';
        setCoverFile(null);
        if (!bookToEdit) setCoverPreview('');
        return;
      }

      setIsCompressingCover(true);
      setCoverPreview(URL.createObjectURL(file));

      try {
        const result = await compressImage(file, { maxWidth: 1600, maxHeight: 2200, quality: 0.85 });
        setCoverFile(result.file);
        setCoverStats(result);
        setCoverPreview(URL.createObjectURL(result.file));
      } catch (err) {
        console.error('Image compression failed, using original:', err);
        setCoverFile(file);
      } finally {
        setIsCompressingCover(false);
      }
    }
  };

  const handleBookFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('Book PDF exceeds 10 MB limit (Cloudinary free tier).', 'error');
        e.target.value = '';
        return;
      }

      setIsCompressingBook(true);
      try {
        const result = await compressPdf(file);
        setBookFile(result.file);
        setBookStats(result);
      } catch (err) {
        console.error('PDF compression failed, using original:', err);
        setBookFile(file);
      } finally {
        setIsCompressingBook(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Book title is required', 'error');
      return;
    }
    if (!genre.trim()) {
      showToast('Please select a category for your eBook', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Book description is required', 'error');
      return;
    }

    try {
      if (bookToEdit) {
        await updateBook(bookToEdit._id, {
          title,
          description,
          genre,
          authorNames: authorNames.trim(),
          ...(coverFile ? { coverImage: coverFile } : {}),
          ...(bookFile ? { file: bookFile } : {}),
        });
        showToast('eBook updated successfully!', 'success');
      } else {
        if (!coverFile) {
          showToast('Please select a cover image (Max 3MB)', 'error');
          return;
        }
        if (!bookFile) {
          showToast('Please select a PDF document (Max 10MB)', 'error');
          return;
        }

        await createBook({
          title,
          description,
          genre,
          authorNames: authorNames.trim(),
          coverImage: coverFile,
          file: bookFile,
        });
        showToast('eBook published successfully!', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error saving book. Please try again.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-lg bg-white border border-slate-200 shadow-xl p-5 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {bookToEdit ? 'Edit eBook Publication' : 'Publish New eBook'}
              </h3>
              <p className="text-xs text-slate-500">
                {bookToEdit
                  ? 'Update publication details and replace book files'
                  : 'Add your digital eBook and cover artwork to the library'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Title & Author Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Book Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Design Guide"
                className="input-field text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Author(s) <span className="text-slate-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={authorNames}
                onChange={(e) => setAuthorNames(e.target.value)}
                placeholder="e.g. Martin Kleppmann, Subhajit"
                className="input-field text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Dynamic Genre Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category / Genre *
            </label>
            {categories.length > 0 ? (
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
                className="input-field text-xs sm:text-sm cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No categories available. Please create categories in the Admin Console first.</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear, engaging overview of this eBook..."
              className="input-field text-xs sm:text-sm"
            />
          </div>

          {/* File Uploads Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Cover Image */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cover Image {!bookToEdit && '*'}
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 hover:bg-white cursor-pointer transition-colors text-center relative overflow-hidden group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                {coverPreview ? (
                  <div className="relative w-full h-24 flex items-center justify-center">
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="max-h-full max-w-full rounded object-cover shadow-xs border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition-opacity font-semibold">
                      Change Cover
                    </div>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-indigo-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      {coverFile ? coverFile.name : 'Choose Image (JPG/PNG/WebP)'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Max size: 15 MB (Auto-compressed)</span>
                  </>
                )}
              </label>

              {(isCompressingCover || coverStats) && (
                <CompressionStatsBadge
                  type="image"
                  stats={coverStats}
                  isCompressing={isCompressingCover}
                />
              )}
            </div>

            {/* PDF File */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                eBook Document (PDF) {!bookToEdit && '*'}
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 hover:bg-white cursor-pointer transition-colors text-center h-30.5 group">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleBookFileChange}
                  className="hidden"
                />
                <FileText className="w-6 h-6 text-indigo-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 truncate max-w-45">
                  {bookFile ? bookFile.name : bookToEdit ? 'Keep existing PDF or replace' : 'Select PDF File'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Max size: 25 MB (Auto-optimized)</span>
              </label>

              {(isCompressingBook || bookStats) && (
                <CompressionStatsBadge
                  type="pdf"
                  stats={bookStats}
                  isCompressing={isCompressingBook}
                />
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{bookToEdit ? 'Save Changes' : 'Publish eBook'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
