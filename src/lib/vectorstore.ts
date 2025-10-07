// Simple file metadata store
// Files are stored in R2, we just track metadata here

import fs from 'fs';
import path from 'path';

export interface FileItem {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf';
  filename: string;
  mediaUrl?: string; // For R2 files: stores R2 key (e.g., "images/123.png"). Legacy: may contain full URL.
  textContent?: string; // For text files
  timestamp: string;
}

class FileStore {
  private items: FileItem[] = [];
  private storageFile: string;

  constructor() {
    // Store data in project root's .vector-store directory
    const storageDir = path.join(process.cwd(), '.vector-store');
    this.storageFile = path.join(storageDir, 'files.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Load existing data
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8');
        this.items = JSON.parse(data);
        console.log(`Loaded ${this.items.length} files from store`);
      }
    } catch (error) {
      console.error('Failed to load file store:', error);
      this.items = [];
    }
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.items, null, 2));
    } catch (error) {
      console.error('Failed to save file store:', error);
    }
  }

  async add(item: FileItem): Promise<void> {
    // Reload from file first to get latest data
    this.loadFromFile();
    this.items.push(item);
    this.saveToFile();
    console.log(`File added. Total files: ${this.items.length}`);
  }

  async getAll(limit: number = 50): Promise<FileItem[]> {
    // Always reload from file to ensure we have the latest data
    this.loadFromFile();
    console.log(`Getting all files. Total: ${this.items.length}`);
    return this.items.slice(-limit).reverse();
  }

  async getById(id: string): Promise<FileItem | undefined> {
    return this.items.find(item => item.id === id);
  }

  async delete(id: string): Promise<boolean> {
    // Reload from file first to get latest data
    this.loadFromFile();
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);

    if (this.items.length < initialLength) {
      this.saveToFile();
      console.log(`File deleted. Remaining files: ${this.items.length}`);
      return true;
    }

    return false;
  }
}

// Singleton instance
let fileStore: FileStore | null = null;

export function getFileStore(): FileStore {
  if (!fileStore) {
    fileStore = new FileStore();
  }
  return fileStore;
}

export async function addFile(item: FileItem): Promise<void> {
  const store = getFileStore();
  await store.add(item);
}

export async function getAllFiles(limit: number = 50): Promise<FileItem[]> {
  const store = getFileStore();
  return store.getAll(limit);
}

export async function getFileById(id: string): Promise<FileItem | undefined> {
  const store = getFileStore();
  return store.getById(id);
}

export async function deleteFile(id: string): Promise<boolean> {
  const store = getFileStore();
  return store.delete(id);
}