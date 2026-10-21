import path from 'path';
import url from 'url';
import crypto from 'crypto';
import fs from 'fs-extra';
import { valueType } from '@ostro/support/function';

const kConfig: unique symbol = Symbol('config');
const kPrefix: unique symbol = Symbol('prefix');
const kRootPath: unique symbol = Symbol('rootPath');
const kRootUrl: unique symbol = Symbol('rootUrl');

/**
 * Class StoreHelper.
 */
class StoreHelper {

    [kConfig]: Record<string, any>;
    [kPrefix]: string;
    [kRootPath]?: string;
    [kRootUrl]?: string;

    /**
     * Create a new instance.
     * @param config - Adapter configuration
     * @param prefix - Key prefix
     */
    constructor(config: Record<string, any> = {}, prefix: string = '') {
        this[kConfig] = config;
        this[kPrefix] = prefix;
    }

    /**
     * Get store configuration.
     * @returns Configuration object or null
     */
    public getConfig(): Record<string, any> | null {
        return this[kConfig] || null;
    }

    /**
     * Set root URL.
     * @param root - Base URL
     */
    public setRootUrl(root: string): void {
        this[kRootUrl] = url.resolve(root, '');
    }

    /**
     * Set root storage path and ensure directory exists.
     * @param root - Root directory path
     */
    public setRootPath(root: string): void {
        this[kRootPath] = path.normalize(root);
        fs.mkdirSync(path.normalize(this[kRootPath]), {
            recursive: true
        });
    }

    /**
     * Get prefix string.
     * @returns Prefix
     */
    public getPrefix(): string {
        return this[kPrefix] || '';
    }

    /**
     * Apply dot prefix to key.
     * @param key - Cache key
     * @returns Prefixed key
     */
    public applyDotPrefix(key: string = ''): string {
        return this.getPrefix() + '.' + key;
    }

    /**
     * Get root storage path.
     * @returns Root directory path
     */
    public getRootPath(): string | undefined {
        return this[kRootPath];
    }

    /**
     * Apply path prefix with md5 hash.
     * @param dest - Destination key
     * @returns Absolute path to file
     */
    public applyPathPrefix(dest: string): string {
        return path.resolve(this[kRootPath] || '', crypto.createHash('md5').update(this.getPrefix() + '_' + dest).digest('hex'));
    }

    /**
     * Get root URL.
     * @returns Root URL string
     */
    public getRootUrl(): string | undefined {
        return this[kRootUrl];
    }

    /**
     * Apply URL prefix.
     * @param dest - Destination path
     * @returns Resolved URL
     */
    public applyUrlPrefix(dest: string = '/'): string {
        return url.resolve(([this[kRootUrl], dest].join('/')), '');
    }

    /**
     * Ensure directory exists asynchronously.
     * @param dir - Directory path
     * @param callback - Callback on completion
     */
    ensureDirectory(dir: string, callback?: (err: Error | null) => void): void {
        (fs as any).ensureDir(dir, callback);
    }

    /**
     * Parse path into components.
     * @param dest - Path string
     * @returns Parsed path object
     */
    public parsePath(dest: string): path.ParsedPath {
        return path.parse(dest);
    }

    /**
     * Get directory name of path.
     * @param dest - Path string
     * @returns Directory path
     */
    public dirname(dest: string): string {
        return this.parsePath(dest).dir;
    }

    /**
     * Extract content item if array.
     * @param content - Content or array of content
     * @returns Extracted content
     */
    public getContent(content: any): any {
        if (Array.isArray(content))
            return content[0];
        else
            return content;
    }

    /**
     * Extract buffer data from content.
     * @param content - Content container
     * @returns Buffer data
     */
    public getBufferData(content: any): any {
        return this.getContent(content).buffer;
    }

    /**
     * Determine value type.
     * @param value - Value to check
     * @returns Type string
     */
    public valueType(value: unknown): string {
        return valueType(value);
    }

    /**
     * Serialize value and detect its type.
     * @param value - Value to serialize
     * @returns Object with serialized value and value type
     */
    public serializeValue(value: unknown): { serializedValue: string; valueType: string } {
        let dataType: string = this.valueType(value);
        return {
            serializedValue: dataType != 'string' ? JSON.stringify(value) : (value as string),
            valueType: dataType
        };
    }

    /**
     * Parse cached payload back to original value.
     * @param obj - Cached object or string or buffer
     * @returns Parsed cache payload
     */
    public parseValue(obj: any): any {
        obj = Buffer.isBuffer(obj) ? obj.toString() : obj;
        obj = typeof obj == 'string' ? JSON.parse(obj) : obj;
        if (['json', 'array', 'number'].includes(obj.valueType)) {
            obj.value = JSON.parse(obj.value);
        }
        obj.expiration = Number(obj.expiration);
        return obj;
    }
}

export default StoreHelper;