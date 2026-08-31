/**
 * Min-Heap (Priority Queue) Implementation for Top-K Element Extraction
 * Time Complexity: O(N log K) instead of full O(N log N) sorting
 * Space Complexity: O(K) bound
 *
 * Classic LeetCode 347 / 703 DSA pattern for real-time trending computation.
 */

export interface HeapItem<T> {
  priority: number;
  data: T;
}

export class MinHeap<T> {
  private heap: HeapItem<T>[] = [];

  constructor(private capacity: number) {}

  size(): number {
    return this.heap.length;
  }

  peek(): HeapItem<T> | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Insert a new item. If heap reaches capacity K and new item > min,
   * evicts root min in O(log K) to maintain Top-K largest items.
   */
  push(priority: number, data: T): void {
    if (this.heap.length < this.capacity) {
      this.heap.push({ priority, data });
      this.bubbleUp(this.heap.length - 1);
    } else if (priority > this.heap[0].priority) {
      this.heap[0] = { priority, data };
      this.sinkDown(0);
    }
  }

  /**
   * Return items sorted descending by priority
   */
  toSortedArray(): T[] {
    return [...this.heap]
      .sort((a, b) => b.priority - a.priority)
      .map((item) => item.data);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIdx].priority) break;
      this.swap(index, parentIdx);
      index = parentIdx;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
