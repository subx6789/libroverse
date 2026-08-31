/**
 * Prefix Trie (Prefix Tree) Data Structure
 * Provides O(K) prefix matching for lightning-fast autocomplete
 * without expensive O(N) regex or database scans.
 *
 * (where K is the length of search prefix query)
 */

export interface TrieItem<T> {
  key: string;
  data: T;
}

class TrieNode<T> {
  children: Map<string, TrieNode<T>> = new Map();
  isEndOfWord: boolean = false;
  items: T[] = [];
}

export class PrefixTrie<T> {
  private root: TrieNode<T>;

  constructor() {
    this.root = new TrieNode<T>();
  }

  /**
   * O(K) Insertion of text key and associated data
   */
  insert(key: string, data: T): void {
    if (!key) return;
    const normalized = key.toLowerCase().trim();
    let current = this.root;

    for (const char of normalized) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode<T>());
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    current.items.push(data);
  }

  /**
   * O(K + M) Prefix Search
   * Finds all items matching the prefix up to limit M
   */
  searchPrefix(prefix: string, limit: number = 6): T[] {
    if (!prefix) return [];
    const normalized = prefix.toLowerCase().trim();
    let current = this.root;

    // 1. Traverse to the node matching the prefix
    for (const char of normalized) {
      if (!current.children.has(char)) {
        return []; // Prefix not found
      }
      current = current.children.get(char)!;
    }

    // 2. DFS traversal to collect all matching downstream items
    const results: T[] = [];
    this.collectAll(current, results, limit);
    return results;
  }

  /**
   * Clear and re-populate the Trie index
   */
  rebuild(items: { key: string; data: T }[]): void {
    this.root = new TrieNode<T>();
    for (const item of items) {
      this.insert(item.key, item.data);
    }
  }

  private collectAll(node: TrieNode<T>, results: T[], limit: number): void {
    if (results.length >= limit) return;

    if (node.isEndOfWord) {
      for (const item of node.items) {
        if (results.length < limit) {
          results.push(item);
        }
      }
    }

    for (const child of node.children.values()) {
      if (results.length >= limit) break;
      this.collectAll(child, results, limit);
    }
  }
}
