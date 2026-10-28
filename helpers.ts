import { IBlog } from "./modals/blog.model";
import { ICourse } from "./modals/course.model";
import { IProduct } from "./modals/product.model";
import { IUser } from "./modals/user.model";

const plainId = (value: any) => value == null ? undefined : String(value);

export const userFilter = (user: any = {}): Partial<IUser> => {
    const { _id, name, email, password, image, role, status, about, phone, username, createdOn, updatedAt }: Partial<IUser> = user;
    return JSON.parse(JSON.stringify({ _id: plainId(_id), name, email, password, image, role, status, about, phone, username, createdOn, updatedAt }));
};

export const blogFilter = (blog: any = {}): Partial<IBlog> => {
    const {
        _id, slug, title, status, description, thumbnail, content, tags, category,
        products, author, publishedAt, updatedAt, createdOn, estimatedMinutes,
        course, seoTitle, seoDescription
    }: Partial<IBlog> = blog;
    return JSON.parse(JSON.stringify({
        _id: plainId(_id), slug, title, status, description, thumbnail, content,
        tags, category, products, author: plainId(author), publishedAt, updatedAt,
        createdOn, estimatedMinutes, course: plainId(course), seoTitle, seoDescription
    }));
};

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
    const copy = { ...product };
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
