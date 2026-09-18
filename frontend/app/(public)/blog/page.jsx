'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BookOpen, Loader2, Image as ImageIcon } from 'lucide-react';

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blogs', { params: { limit: 50 } })
      .then((res) => setBlogs(res.data.blogs || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Blog &amp; News</h1>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            Industry insights, product updates, and company news from Noah Attire.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-alibaba-500" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-14 w-14 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No posts yet</h2>
            <p className="text-gray-400 text-sm mt-2">Check back soon for news and updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-48 bg-gray-100 flex-shrink-0">
                  {blog.coverImage ? (
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  {blog.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {blog.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs bg-alibaba-50 text-alibaba-600 font-medium px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="font-bold text-gray-900 group-hover:text-alibaba-600 transition-colors line-clamp-2 mb-2">
                    {blog.title}
                  </h2>
                  <p className="text-xs text-gray-400 mt-auto">
                    By {blog.authorName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
