import { IBlog } from "./modals/blog.model";
import { ICourse } from "./modals/course.model";
import { IProduct } from "./modals/product.model";
import { IUser } from "./modals/user.model";

const plainId = (value: any) => value == null ? undefined : String(value);

export const userFilter = (user: any = {}): Partial<IUser> => {
    const { _id, name, email, image, role, status, about, phone, username, createdOn, updatedAt }: Partial<IUser> = user;
    return JSON.parse(JSON.stringify({ _id: plainId(_id), name, email, image, role, status, about, phone, username, createdOn, updatedAt }));
};

/**
 * Accounts that may create or remove other administrators. The owner account is
 * always included; additional emails can be supplied at runtime via the
 * comma-separated SUPER_ADMIN_EMAILS environment variable.
 */
export const SUPER_ADMIN_EMAILS = ["mynmss3@gmail.com"];

export const isSuperAdminEmail = (email?: string | null): boolean => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return false;
    const configured = [...SUPER_ADMIN_EMAILS, ...String(process.env.SUPER_ADMIN_EMAILS || "").split(",")]
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    return configured.includes(normalized);
};

const normalizeCategories = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
    if (value === null || value === undefined || value === "") return [];
    return [String(value)];
};

export const blogFilter = (blog: any = {}): Partial<IBlog> => {
    const {
        _id, slug, title, status, description, thumbnail, content, tags, category,
        products, author, publishedAt, updatedAt, createdOn, estimatedMinutes,
        course, seoTitle, seoDescription
    }: Partial<IBlog> = blog;
    return JSON.parse(JSON.stringify({
        _id: plainId(_id), slug, title, status, description, thumbnail, content,
        tags, category: normalizeCategories(category), products, author: plainId(author), publishedAt, updatedAt,
        createdOn, estimatedMinutes, course: plainId(course), seoTitle, seoDescription
    }));
};

/** Legacy blog records may store a single category as a string. */
export const normalizeBlogCategories = (value: unknown) => normalizeCategories(value);

export const courseFilter = (course: any = {}): Partial<ICourse> => {
    const {
        _id, slug, tags, title, status, price, description, thumbnail, content,
        author, publishedAt, createdOn, updatedAt, accessType, currency, level,
        language, estimatedMinutes, prerequisites, landingPage
    }: Partial<ICourse> = course;
    return JSON.parse(JSON.stringify({
        _id: plainId(_id), slug, title, status, tags, price, description, thumbnail,
        content, author: plainId(author), publishedAt, createdOn, updatedAt,
        accessType, currency, level, language, estimatedMinutes, prerequisites, landingPage
    }));
};

export const productFilter = (product: any = {}, str?: any): Partial<IProduct> => {
    // Mongoose documents expose fields through getters, so spreading the document
    // itself would drop `_id`, `title`, etc. Convert it to a plain object first.
    const source = product && typeof product.toObject === "function" ? product.toObject() : product;
    const copy = { ...source };
    str = str?.trim();
    if (str && str.includes("!")) {
        str = str.replace("!", "");
        for (const field of str.split(" ")) copy[field] = undefined;
    } else if (str) {
        const fields = str.split(" ").filter(Boolean);
        const selected: Record<string, unknown> = {};
        for (const field of fields) selected[field] = copy[field];
        Object.assign(copy, selected);
    }
    const {
        _id, slug, title, price, description, thumbnail, tags, fileLink,
        publishedAt, status, currency, seller, fileName, fileSize, mimeType,
        downloadLimit, createdOn, updatedAt
    }: Partial<IProduct> = copy;
    return JSON.parse(JSON.stringify({
        _id: plainId(_id), slug, title, price, description, thumbnail, tags,
        fileLink, publishedAt, status, currency, seller: plainId(seller), fileName,
        fileSize, mimeType, downloadLimit, createdOn, updatedAt
    }));
};

export const err = <T>(error: any, tp?: "m" | "f", e?: { ret: T }) => {
    if (!tp || tp === "f") console.error(error);
    else if (tp === "m") console.error(error?.message);
    return e?.ret as T;
};
