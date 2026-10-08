import Link from 'next/link';
export default function NotFound() {
  return <main className="mx-auto max-w-5xl space-y-4 p-6"><h1 className="text-3xl font-bold">Page not found</h1><p>The page or product could not be found.</p><Link href="/products" className="underline">Browse products</Link></main>;
}
