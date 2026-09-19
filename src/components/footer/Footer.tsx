import React from 'react';
import packageJson from '../../../package.json';

export function Footer() {
  const version = packageJson.version || '1.0.0';
  
  return (
    <footer className="w-full bg-slate-100 border-t border-slate-200 py-4 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <div className="mb-2 md:mb-0 flex items-center space-x-2">
          <span className="font-semibold text-slate-700">CSCP GeoEpi</span>
          <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">v{version}</span>
        </div>
        <div className="flex flex-col md:flex-row items-center md:space-x-4">
          <p>
            Developed by <span className="font-semibold text-slate-700">Tomvis</span>
          </p>
          <div className="hidden md:block w-1 h-1 rounded-full bg-slate-300"></div>
          <p>&copy; {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-200 text-center">
        <a href="/academic" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          ศูนย์วิชาการและกฎหมาย (KBS Academic & Legal Knowledge Center)
        </a>
      </div>
    </footer>
  );
}
