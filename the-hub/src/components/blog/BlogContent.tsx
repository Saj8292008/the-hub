/**
 * Blog Content Component
 * Renders Markdown content with syntax highlighting and custom styles
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/atom-one-dark.css';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          // Custom heading styles
          h1: ({ children, ...props }) => (
            <h1
              className="mb-6 mt-8 text-4xl font-bold text-white"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="mb-4 mt-8 text-3xl font-bold text-white"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="mb-3 mt-6 text-2xl font-semibold text-white"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="mb-2 mt-4 text-xl font-semibold text-white"
              {...props}
            >
              {children}
            </h4>
          ),

          // Paragraph
          p: ({ children, ...props }) => (
            <p className="mb-4 leading-relaxed text-gray-300" {...props}>
              {children}
            </p>
          ),

          // Links
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="font-medium text-purple-400 underline decoration-purple-400/30 underline-offset-4 transition-colors hover:text-purple-300 hover:decoration-purple-300/50"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),

          // Lists
          ul: ({ children, ...props }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),

          // Blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-6 border-l-4 border-purple-500 bg-gray-800/50 py-4 pl-6 pr-4 italic text-gray-300"
              {...props}
            >
              {children}
            </blockquote>
          ),

          // Code blocks
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-sm text-purple-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              className="my-6 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm"
              {...props}
            >
              {children}
            </pre>
          ),

          // Images
          img: ({ src, alt, ...props }) => (
            <figure className="my-8">
              <img
                src={src}
                alt={alt || ''}
                className="rounded-xl"
                loading="lazy"
                {...props}
              />
              {alt && (
                <figcaption className="mt-2 text-center text-sm text-gray-500">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // Tables
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table
                className="w-full border-collapse border border-gray-700"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-800" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props}>{children}</tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-gray-700" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-4 py-2 text-left font-semibold text-white"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 text-gray-300" {...props}>
              {children}
            </td>
          ),

          // Horizontal rule
          hr: (props) => (
            <hr className="my-8 border-gray-800" {...props} />
          ),

          // Strong/bold
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-white" {...props}>
              {children}
            </strong>
          ),

          // Emphasis/italic
          em: ({ children, ...props }) => (
            <em className="italic text-gray-200" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
