'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function NavLinks({ isAdmin }: { isSignedIn: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [{ href: '/', label: 'Shop' }, { href: '/products', label: 'Products' }, ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : [])];
  return <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-4">{links.map(({ href, label }) => {
    const active = href === '/' ? pathname === '/' || pathname === '/shop' : pathname.startsWith(href);
    return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'font-semibold underline underline-offset-4' : 'hover:underline'}>{label}</Link>;
  })}</nav>;
}
