import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, PackageX } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center mx-auto mb-4">
        <PackageX className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-ink">404 — Halaman Tidak Ditemukan</h1>
      <p className="mt-2 text-sm text-muted max-w-md">
        Halaman yang Anda tuju tidak tersedia atau tautan telah dipindahkan.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-canvas text-ink flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <Link
          to="/"
          className="px-4 py-2 text-xs font-bold rounded-lg bg-magenta-500 hover:bg-magenta-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Ke Beranda Toko</span>
        </Link>
      </div>
    </div>
  );
};
