import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { z } from 'zod';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: '../docs/content',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const blogPosts = defineCollections({
  type: 'doc',
  dir: '../docs/content/blog',
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.coerce.date().optional(),
  }),
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
