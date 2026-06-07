import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Trash2, ExternalLink, ShieldAlert, Link as LinkIcon, Power, Settings } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface CerdasModuleProps {
  onBack: () => void;
}

interface ReportLink {
  id: string;
  title: string;
  url: string;
  isOpen: boolean;
}

export const CerdasModule: React.FC<CerdasModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [links, setLinks] = useState<ReportLink[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('garda_report_links');
    if (saved) {
      setLinks(JSON.parse(saved));
    }
  }, []);

  const saveLinks = (newLinks: ReportLink[]) => {
    setLinks(newLinks);
    localStorage.setItem('garda_report_links', JSON.stringify(newLinks));
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newLink: ReportLink = {
      id: `link_${Date.now()}`,
      title: newTitle,
      url: formattedUrl,
      isOpen: true,
    };

    saveLinks([...links, newLink]);
    setNewTitle('');
    setNewUrl('');
  };

  const handleToggleAccess = (id: string) => {
    const updated = links.map(link => 
      link.id === id ? { ...link, isOpen: !link.isOpen } : link
    );
    saveLinks(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus tautan ini?')) {
      const updated = links.filter(link => link.id !== id);
      saveLinks(updated);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-slate-500 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Akses Ditolak</h2>
        <p>Anda harus login terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laporan Pendataan</h1>
            <p className="text-slate-500 font-medium">Aplikasi pelaporan dan monitoring pendataan lapangan</p>
          </div>
        </div>
        
        {user.role === 'admin' && (
          <a 
            href="https://editor.dvlpid.my.id/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100"
          >
            <Settings className="w-5 h-5" />
            <span>Buka Editor Cerdas</span>
          </a>
        )}
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[70vh]"
      >
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center text-sm">
          <div className="font-medium text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Akses: {user.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}
          </div>
        </div>

        <div className="p-6 md:p-8 flex-1 space-y-8">
          
          {user.role === 'admin' && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Buat Tombol Pelaporan Baru
              </h3>
              <form onSubmit={handleAddLink} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nama Laporan (Cth: Laporan Sensus Pertanian)"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                    required
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="url" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Link Web Editor (Cth: https://...)"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                    required
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors whitespace-nowrap shadow-md">
                  Tambahkan
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">Daftar Formulir Pelaporan</h3>
            
            {links.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                Belum ada tombol pelaporan yang dibuat oleh Admin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {links.map((link) => {
                  const isAccessible = link.isOpen || user.role === 'admin';
                  
                  return (
                    <motion.div 
                      key={link.id} 
                      whileHover={link.isOpen ? { y: -5, scale: 1.02 } : {}}
                      className={`flex flex-col p-6 rounded-[2rem] border-2 transition-all duration-300 ${!link.isOpen ? 'bg-slate-50 border-slate-200 opacity-75 grayscale-[0.2]' : 'bg-gradient-to-br from-white to-slate-50/50 border-primary-100 shadow-xl shadow-primary-900/5'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-4 rounded-2xl shadow-inner ${link.isOpen ? 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                            <LinkIcon className="w-7 h-7" />
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Menghapus line-clamp-1 agar teks panjang tidak terpotong, text akan turun ke baris baru */}
                            <h4 className="font-black text-slate-800 text-xl leading-tight break-words">{link.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${link.isOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                {link.isOpen ? '✓ Akses Dibuka' : '✕ Akses Ditutup'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto flex flex-col gap-3">
                        {isAccessible ? (
                          <a 
                            href={link.isOpen ? link.url : undefined} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 ${link.isOpen ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-500 hover:to-indigo-500 shadow-lg shadow-primary-500/30 border border-primary-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'}`}
                            onClick={(e) => !link.isOpen && e.preventDefault()}
                          >
                            <span>{link.isOpen ? 'BUKA FORMULIR' : 'AKSES DITUTUP'}</span>
                            {link.isOpen && <ExternalLink className="w-5 h-5" />}
                          </a>
                        ) : (
                          <div className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-lg bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200">
                            AKSES DITUTUP ADMIN
                          </div>
                        )}

                        {user.role === 'admin' && (
                          <div className="flex gap-3 border-t-2 border-slate-100 pt-4 mt-2">
                            <button 
                              onClick={() => handleToggleAccess(link.id)}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all border-2 ${link.isOpen ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'}`}
                            >
                              <Power className="w-5 h-5" />
                              {link.isOpen ? 'Tutup Akses' : 'Buka Akses'}
                            </button>
                            <button 
                              onClick={() => handleDelete(link.id)}
                              className="px-5 py-3 bg-white border-2 border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-xl transition-all shadow-sm"
                              title="Hapus Tombol"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

