/**
 * High-Performance LRU (Least Recently Used) Cache with TTL
 * Data Structure: Doubly Linked List + Hash Map (O(1) Get, O(1) Put, O(1) Eviction)
 *
 * Why this is used:
 * Guarantees strict constant-time lookups and memory-safe bounded eviction
 * without external Redis infrastructure dependencies.
 */

class LRUNode<K, V> {
  key: K;
  value: V;
  expiresAt: number;
  prev: LRUNode<K, V> | null = null;
  next: LRUNode<K, V> | null = null;

  constructor(key: K, value: V, ttlMs: number) {
    this.key = key;
    this.value = value;
    this.expiresAt = Date.now() + ttlMs;
  }

  isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private defaultTtlMs: number;
  private map: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V>; // Dummy Head (Most recently used)
  private tail: LRUNode<K, V>; // Dummy Tail (Least recently used)

  constructor(capacity: number = 200, defaultTtlMs: number = 24 * 60 * 60 * 1000) {
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map<K, LRUNode<K, V>>();

    // Initialize dummy boundary nodes for O(1) pointer manipulations
    this.head = new LRUNode<K, V>(null as any, null as any, 0);
    this.tail = new LRUNode<K, V>(null as any, null as any, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * O(1) Lookup: Retrieves value and moves node to the head of the Doubly Linked List
   */
  get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) return null;

    // Check expiration
    if (node.isExpired()) {
      this.removeNode(node);
      this.map.delete(key);
      return null;
    }

    // Move to front (Most Recently Used)
    this.moveToHead(node);
    return node.value;
  }

  /**
   * O(1) Insert / Update: Adds node to head and evicts tail if capacity is exceeded
   */
  put(key: K, value: V, ttlMs: number = this.defaultTtlMs): void {
    const existing = this.map.get(key);

    if (existing) {
      existing.value = value;
      existing.expiresAt = Date.now() + ttlMs;
      this.moveToHead(existing);
      return;
    }

    // Evict least recently used if at capacity
    if (this.map.size >= this.capacity) {
      const lru = this.tail.prev;
      if (lru && lru !== this.head) {
        this.removeNode(lru);
        this.map.delete(lru.key);
      }
    }

    const newNode = new LRUNode(key, value, ttlMs);
    this.addNodeToHead(newNode);
    this.map.set(key, newNode);
  }

  /**
   * Returns current cache size
   */
  size(): number {
    return this.map.size;
  }

  // --- Internal Doubly Linked List Operations O(1) ---

  private addNodeToHead(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    if (this.head.next) {
      this.head.next.prev = node;
    }
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addNodeToHead(node);
  }
}

// Global Singleton Instance: 200 Max Entries, 24-Hour TTL
export const aiLRUCache = new LRUCache<string, any>(200, 24 * 60 * 60 * 1000);
