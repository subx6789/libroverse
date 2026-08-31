import { EventEmitter } from "node:events";

export type PostEventType = "POST_CREATED" | "POST_LIKED" | "COMMENT_ADDED" | "POST_DELETED";

export interface PostEventPayload {
  type: PostEventType;
  postId?: string;
  topic?: string;
  authorName?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp: string;
}

class PostEventHub extends EventEmitter {
  constructor() {
    super();
    // Allow up to 100 concurrent SSE listeners per process without memory leak warnings
    this.setMaxListeners(100);
  }

  broadcast(event: PostEventPayload) {
    this.emit("post_event", event);
  }
}

export const postEventHub = new PostEventHub();
