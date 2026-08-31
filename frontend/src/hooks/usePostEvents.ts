import { useEffect, useRef, useState, useCallback } from 'react';

export interface PostStreamEvent {
  type: 'CONNECTED' | 'POST_CREATED' | 'POST_LIKED' | 'COMMENT_ADDED' | 'POST_DELETED';
  postId?: string;
  topic?: string;
  authorName?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp: string;
}

interface UsePostEventsOptions {
  onPostCreated?: (event: PostStreamEvent) => void;
  onPostLiked?: (event: PostStreamEvent) => void;
  onCommentAdded?: (event: PostStreamEvent) => void;
}

export const usePostEvents = (options?: UsePostEventsOptions) => {
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [latestEvent, setLatestEvent] = useState<PostStreamEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const resetNewPostsCount = useCallback(() => {
    setNewPostsCount(0);
  }, []);

  useEffect(() => {
    // Construct SSE stream URL matching API base
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const streamUrl = apiUrl.startsWith('http')
      ? `${apiUrl}/posts/stream`
      : `/api/posts/stream`;

    let sse: EventSource;
    try {
      sse = new EventSource(streamUrl);
      eventSourceRef.current = sse;

      sse.onopen = () => {
        setIsConnected(true);
      };

      sse.onmessage = (e) => {
        try {
          if (!e.data || e.data.trim() === '') return;
          const data: PostStreamEvent = JSON.parse(e.data);
          setLatestEvent(data);

          if (data.type === 'POST_CREATED') {
            setNewPostsCount((prev) => prev + 1);
            options?.onPostCreated?.(data);
          } else if (data.type === 'POST_LIKED') {
            options?.onPostLiked?.(data);
          } else if (data.type === 'COMMENT_ADDED') {
            options?.onCommentAdded?.(data);
          }
        } catch (parseErr) {
          // ignore non-json messages like heartbeat comments
        }
      };

      sse.onerror = () => {
        setIsConnected(false);
        // Native EventSource auto-reconnects automatically with exponential backoff
      };
    } catch (err) {
      console.warn('SSE connection initialization error', err);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    newPostsCount,
    resetNewPostsCount,
    latestEvent,
    isConnected,
  };
};
