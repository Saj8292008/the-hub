/**
 * Table of Contents Component
 * Auto-generates navigation from H2 headings in markdown content
 */

import { useState, useEffect } from 'react';
import { List } from 'lucide-react';

interface ToCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<ToCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown
    const extractedHeadings = extractHeadings(content);
    setHeadings(extractedHeadings);

    // Set up intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
      }
    );

    // Observe all headings
    extractedHeadings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [content]);

  const extractHeadings = (markdown: string): ToCItem[] => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const headings: ToCItem[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      headings.push({ id, text, level });
    }

    return headings;
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
      <div className="mb-4 flex items-center gap-2 font-semibold text-white">
        <List className="h-5 w-5" />
        <h2>Table of Contents</h2>
      </div>

      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{
              paddingLeft: heading.level === 3 ? '1rem' : '0',
            }}
          >
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`w-full text-left text-sm transition-colors ${
                activeId === heading.id
                  ? 'font-medium text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
