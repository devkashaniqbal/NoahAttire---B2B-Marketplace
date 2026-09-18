'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blogs/${slug}`)
      .then((res) => setBlog(res.data.blog))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-alibaba-500" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <BookOpen className="h-14 w-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Post not found</h2>
        <Button className="mt-4" asChild>
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-alibaba-600">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-alibaba-600">Blog</Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[200px]">{blog.title}</span>
          </nav>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cover image */}
        {blog.coverImage && (
          <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-8">
            <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" priority />
          </div>
        )}

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag) => (
              <span key={tag} className="text-xs bg-alibaba-50 text-alibaba-600 font-medium px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {blog.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span>By <span className="font-medium text-gray-600">{blog.authorName}</span></span>
        </div>

        {/* Content */}
        <div className="prose max-w-none">
          {blog.content.split(/\n\n+/).map((para, i) => (
            <p key={i} className="text-gray-700 leading-relaxed text-base mb-5 whitespace-pre-wrap">
              {para}
            </p>
          ))}
        </div>

        {/* Back */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
