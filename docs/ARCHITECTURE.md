# 📐 System Architecture Document (SAD)

**Document Version:** 1.0.0  
**Architectural Style:** Modular Clean Layered / Event-Driven  

---

## 1. High-Level Architectural Decomposition

LibroVerse is architected using a decoupled **Client-Server & Cloud Services** topology designed for resilience, zero-disk overhead, and high computational efficiency.

```mermaid
C4Context
    title System Context Diagram (C4 Level 1) for LibroVerse

    Person(reader, "Reader / Member", "Discovers books, reads PDFs, joins discussions, and uses AI analysis.")
    Person(admin, "Administrator", "Manages library catalog, categories, user governance, and analytics.")

    System(libroverse, "LibroVerse Platform", "Full-stack digital eBook reader and community platform.")

    System_Ext(mongo, "MongoDB Atlas", "Primary document storage & indexed social graphs.")
    System_Ext(cloudinary, "Cloudinary CDN", "Optimized media delivery and digital PDF streaming.")
    System_Ext(hf, "Hugging Face Inference", "Serverless open-source LLM processing.")

    Rel(reader, libroverse, "Interacts via Web Browser (HTTPS / SSE)")
    Rel(admin, libroverse, "Manages via Admin Console (HTTPS)")
    Rel(libroverse, mongo, "Stores metadata, users, posts & indexes")
    Rel(libroverse, cloudinary, "Streams buffers & serves assets")
    Rel(libroverse, hf, "Sends prompt tokens & retrieves analysis")
```

---

## 2. Component & Container Architecture (C4 Level 2)

```mermaid
graph TB
    subgraph FrontendApp ["Frontend Client Container (Vite + React 19)"]
        Router["React Router 7"]
        UIViews["Views (Catalog, Reader, Feed, Admin)"]
        ZStores["Zustand Modular Stores (Auth, Book, Post, Category, User)"]
        SSEClient["SSE Event Client"]
    end

    subgraph BackendApp ["Backend API Container (Express 5 + TypeScript)"]
        Gateway["Rate Limiter & Zod Validation Middleware"]
        AuthModule["JWT & RBAC Middleware"]
        Controllers["Controllers (Book, User, Post, Category, AI)"]
        MemBuffer["In-Memory Stream Buffer (Multer)"]
        AICacheEngine["In-Memory LRU Cache Engine (O(1))"]
        SSEHub["Server-Sent Events Hub (EventEmitter)"]
    end

    Router --> UIViews
    UIViews --> ZStores
    UIViews --> SSEClient
    ZStores -->|REST API Calls| Gateway

    Gateway --> AuthModule
    AuthModule --> Controllers
    Controllers --> MemBuffer
    Controllers --> AICacheEngine
    Controllers --> SSEHub
    SSEHub -.->|Live Event Stream| SSEClient
```

---

## 3. Database Schema & Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ POST : authors
    USER ||--o{ BOOK : uploads
    USER ||--o{ COMMENT : writes
    BOOK ||--o{ POST : referenced_in
    POST ||--o{ COMMENT : contains
    CATEGORY ||--o{ BOOK : classifies

    USER {
        ObjectId _id PK
        string name
        string username UK
        string email UK
        string password
        string role "admin | user"
        string avatar
        string bio
        boolean isBanned
        ObjectId[] savedPosts
        ObjectId[] followers
        ObjectId[] following
        Date createdAt
    }

    BOOK {
        ObjectId _id PK
        string title
        string description
        string genre
        ObjectId author FK
        string file "PDF Cloud URL"
        string coverImage "Cover Cloud URL"
        Date createdAt
    }

    POST {
        ObjectId _id PK
        string title
        string content
        string topic "Channel Name"
        ObjectId author FK
        ObjectId ebook_id FK
        string media_url
        string media_type "image | video"
        number likes_count
        number shares_count
        number total_comments_count
        Comment[] recent_comments "Embedded (Top 3)"
        Date createdAt
    }

    CATEGORY {
        ObjectId _id PK
        string name UK
        string description
        Date createdAt
    }
```

---

## 4. Key Architectural Design Patterns

### 4.1 In-Memory Buffer Streaming Pattern
To eliminate disk I/O vulnerabilities and file persistence risks on serverless platforms, all file uploads use `multer.memoryStorage()`. Binary streams are piped directly to CDN storage using NodeJS readable streams:
- Zero temporary files written to the local operating system.
- Memory garbage collection automatically reclaims buffer memory post-upload.

### 4.2 Two-Tier Quality Guardrail & Caching Pattern
```mermaid
flowchart LR
    Input["User Input"] --> Gate["Syntax & Spam Guardrail"]
    Gate -->|Valid Passage| Cache{"LRU Cache Check"}
    Gate -->|Spam / Prank| Reject["400 Bad Request (0 Tokens)"]
    Cache -->|Hit| ReturnCache["Instant Cached Result"]
    Cache -->|Miss| Inference["LLM Inference Engine"]
    Inference --> SaveCache["Cache Entry (24h TTL)"]
    SaveCache --> ReturnResult["Return Response"]
```

### 4.3 Real-Time Server-Sent Events (SSE) Hub
Uses Node.js native `EventEmitter` with persistent HTTP `text/event-stream` connections:
- Dispatches post creations, comment updates, and like counters to all connected clients in real time.
- Emits periodic 25-second keep-alive heartbeats (`:keepalive`) to prevent proxy timeout disconnections.
