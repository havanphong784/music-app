import slugify from "slugify";
import prisma from "../../../config/db";

export const convertToSlug = (text: string): string => {
    return slugify(text, {
        replacement: "-",
        lower: true,
        strict: true,
        locale: "vi"
    });
};

export const generateUniqueGenreSlug = async (nameOrSlug: string, excludeId?: number): Promise<string> => {
    const maxLength = 50;
    const baseSlug = (convertToSlug(nameOrSlug) || "genre").slice(0, maxLength);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const exist = await prisma.genres.findUnique({
            where: {slug}
        });

        if (!exist || (excludeId !== undefined && exist.id === excludeId)) {
            return slug;
        }

        const suffix = `-${counter}`;
        slug = `${baseSlug.slice(0, maxLength - suffix.length)}${suffix}`;
        counter++;
    }
};
