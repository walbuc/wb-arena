import type calculateReadingTime from "reading-time";
import type { User } from "@prisma/client";

type MdxPage = {
  code: string;
  slug: string;
  editLink: string;
  readTime?: ReturnType<typeof calculateReadingTime>;
  frontmatter: {
    archived?: boolean;
    draft?: boolean;
    unlisted?: boolean;
    title?: string;
    description?: string;
    meta?: {
      keywords?: Array<string>;
      [key as string]: string;
    };

    // Post meta
    categories?: Array<string>;
    date?: string;
    bannerBlurDataUrl?: string;
    bannerCloudinaryId?: string;
    bannerCredit?: string;
    bannerAlt?: string;
    bannerTitle?: string;
    socialImageTitle?: string;
    socialImagePreTitle?: string;
    translations?: Array<{
      language: string;
      link: string;
      author?: {
        name: string;
        link?: string;
      };
    }>;
  };
};

type GitHubFile = { path: string; content: string };

/**
 * This is a separate type from MdxPage because the code string is often
 * pretty big and the pages that simply list the pages shouldn't include the code.
 */
type MdxListItem = Omit<MdxPage, "code">;

type NonNullProperties<Type> = {
  [Key in keyof Type]-?: Exclude<Type[Key], null | undefined>;
};

export { MdxPage, MdxListItem, GitHubFile, User, NonNullProperties };
