
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Trash2, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  UserPlus,
  Target,
  FileText,
  FileJson,
  Table,
  Info,
  Clock,
  Users,
  ChevronRight,
  X,
  Edit3,
  Check,
  FileCode,
  Download
} from 'lucide-react';
import { Trainee, ExportFormat } from './types';
import { extractNamesFromTranscript } from './services/geminiService';

const App: React.FC = () => {
  const [names, setNames] = useState<Trainee[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shooting_range_names');
    if (saved) {
      setNames(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shooting_range_names', JSON.stringify(names));
    if (names.length > 0) {
      setLastAdded(names[0].timestamp);
    }
  }, [names]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-EG';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = async (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      setIsListening(false);
      handleTranscript(currentTranscript);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const extractedNames = await extractNamesFromTranscript(text);
    
    if (extractedNames.length > 0) {
      const newTrainees: Trainee[] = extractedNames.map(name => ({
        id: crypto.randomUUID(),
        name: name.trim(),
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }));
      setNames(prev => [...newTrainees, ...prev]);
    }
    setIsProcessing(false);
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      setNames(prev => prev.map(n => n.id === editingId ? { ...n, name: editValue.trim() } : n));
      setEditingId(null);
    }
  };

  const exportToWord = () => {
    if (names.length === 0) return;
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>قائمة الحضور</title>
      <style>
        table { border-collapse: collapse; width: 100%; direction: rtl; font-family: 'Arial', sans-serif; }
        th, td { border: 1px solid black; padding: 8px; text-align: right; }
        th { background-color: #f2f2f2; }
        h2 { text-align: center; color: #cc0000; }
      </style>
      </head><body>
      <h2>مركز الرماية بالقاهرة - قائمة الحضور</h2>
      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>الاسم</th>
            <th>الوقت</th>
          </tr>
        </thead>
        <tbody>
          ${names.map((n, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${n.name}</td>
              <td>${n.timestamp}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style='text-align:center; font-size:10px;'>تم الاستخراج بواسطة نظام تلاشاني</p>
      </body></html>`;

    const blob = new Blob([header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `حضور_رماية_القاهرة_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportData = (format: ExportFormat) => {
    if (names.length === 0) return;
    let content = '';
    let mimeType = '';
    let fileName = `رماية_القاهرة_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`;

    if (format === ExportFormat.CSV) {
      content = "\ufeffالاسم,الوقت\n" + names.map(n => `${n.name},${n.timestamp}`).join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    } else if (format === ExportFormat.JSON) {
      content = JSON.stringify(names, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      content = "قائمة متدربي الرماية - القاهرة\n" + "=".repeat(30) + "\n" + names.map(n => `${n.name} [${n.timestamp}]`).join('\n');
      mimeType = 'text/plain';
      fileName += '.txt';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteName = (id: string) => {
    setNames(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-['Cairo']">
      {/* Top Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-red-500 to-red-700 p-2.5 rounded-xl shadow-lg shadow-red-900/20 rotate-3 transition-transform hover:rotate-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-slate-400">
                مركز الرماية بالقاهرة
              </h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-red-500 font-bold">
                <span>النسخة الاحترافية V2</span>
                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                <span>تلاشاني</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
          >
            <span className="text-sm font-semibold group-hover:text-red-400">الدعم</span>
            <Info className="w-4 h-4 text-slate-400 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </header>

      {/* Stats & Controls */}
      <div className="max-w-5xl mx-auto px-6 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl flex items-center gap-3 border-white/5">
          <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-400" /></div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase">المسجلين</p>
            <p className="text-lg font-bold tracking-tighter">{names.length}</p>
          </div>
        </div>
        <div className="glass p-4 rounded-2xl flex items-center gap-3 border-white/5">
          <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="w-5 h-5 text-amber-400" /></div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase">آخر إضافة</p>
            <p className="text-lg font-bold tracking-tighter">{lastAdded || '--:--'}</p>
          </div>
        </div>
        <div className="hidden md:flex glass p-4 rounded-2xl items-center gap-3 border-white/5 col-span-2">
           <div className="p-2 bg-green-500/10 rounded-lg"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
           <p className="text-sm text-slate-300">يتم حفظ البيانات تلقائياً، يمكنك تعديل أي اسم بالضغط عليه.</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {/* Modern Mic Section */}
        <section className="relative overflow-hidden glass rounded-[2.5rem] p-12 border-white/10 group shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[120px] -mr-40 -mt-40"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-8 group/btn">
              {isListening && (
                <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-20 scale-[1.8] duration-[2000ms]"></div>
              )}
              <button
                onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 relative ${
                  isListening 
                    ? 'bg-red-600 rotate-90 scale-110 shadow-red-500/50' 
                    : 'bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 border border-white/10 shadow-black'
                }`}
              >
                {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
              </button>
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black italic tracking-tighter">
                {isListening ? 'أنا أسمعك...' : 'ابدأ التسجيل'}
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                انطق الأسماء بوضوح وسيقوم الذكاء الاصطناعي بتنظيمها في الجدول
              </p>
            </div>

            {isProcessing && (
              <div className="mt-10 flex items-center gap-4 px-8 py-4 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 animate-pulse font-black text-sm">
                <UserPlus className="w-6 h-6" />
                <span>جاري معالجة البيانات...</span>
              </div>
            )}

            {transcript && !isProcessing && (
              <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/5 w-full max-w-2xl text-center shadow-inner">
                <p className="text-slate-500 text-[10px] mb-2 uppercase tracking-[0.2em] font-black">النص المستلم</p>
                <p className="text-slate-200 text-lg font-medium italic">"{transcript}"</p>
              </div>
            )}
          </div>
        </section>

        {/* Professional Table Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-4">
                <div className="w-3 h-10 bg-red-600 rounded-full"></div>
                <div>
                   <h3 className="text-2xl font-black italic">جدول الحضور اليومي</h3>
                   <p className="text-[10px] text-slate-500 uppercase font-bold">يمكنك الضغط على الاسم لتعديله</p>
                </div>
             </div>
             {names.length > 0 && (
                <button 
                  onClick={() => { if(confirm('تنبيه: سيتم مسح جميع الأسماء نهائياً!')) setNames([]) }}
                  className="px-5 py-2.5 rounded-xl bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-red-900/50"
                >
                  تصفير الجدول
                </button>
             )}
          </div>

          <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-5 text-slate-400 font-black text-xs uppercase w-16 text-center">م</th>
                  <th className="px-6 py-5 text-slate-400 font-black text-xs uppercase">الاسم الكامل</th>
                  <th className="px-6 py-5 text-slate-400 font-black text-xs uppercase w-32">وقت الوصول</th>
                  <th className="px-6 py-5 text-slate-400 font-black text-xs uppercase w-32 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {names.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <div className="flex flex-col items-center opacity-20">
                          <Target className="w-20 h-20 mb-4" />
                          <p className="text-xl font-black">لا توجد بيانات حالياً</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  names.map((item, index) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-center text-slate-500 font-black font-mono">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              className="bg-slate-800 border border-blue-500 rounded-lg px-3 py-1.5 text-white w-full outline-none focus:ring-2 ring-blue-500/20"
                            />
                            <button onClick={saveEdit} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500">
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            onClick={() => startEditing(item.id, item.name)}
                            className="text-lg font-bold text-slate-200 cursor-pointer hover:text-red-400 transition-colors flex items-center gap-2"
                          >
                            {item.name}
                            <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-40" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                          {item.timestamp}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                           <button 
                            onClick={() => deleteName(item.id)}
                            className="p-2 rounded-xl bg-red-500/0 hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                           >
                            <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modern Export Bar */}
      {names.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="glass px-3 py-3 rounded-[2rem] flex items-center gap-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-white/10 backdrop-blur-3xl border">
            <div className="px-4 text-[10px] font-black uppercase text-slate-500 ml-2 hidden md:block">تصدير الملفات</div>
            
            <button 
              onClick={exportToWord}
              className="group flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-[1.5rem] text-xs font-black transition-all hover:scale-105"
            >
              <FileCode className="w-4 h-4" /> 
              <span>Word جدول</span>
            </button>

            <button 
              onClick={() => exportData(ExportFormat.CSV)}
              className="group flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 px-6 py-3 rounded-[1.5rem] text-xs font-black transition-all hover:scale-105"
            >
              <Table className="w-4 h-4" /> CSV
            </button>

            <button 
              onClick={() => exportData(ExportFormat.TXT)}
              className="group flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-[1.5rem] text-xs font-black transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" /> نصي
            </button>
            
            <button 
              onClick={() => exportData(ExportFormat.JSON)}
              className="p-3 bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-white rounded-full transition-all"
              title="JSON"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative glass max-w-md w-full rounded-[3rem] p-12 border-white/10 shadow-[0_0_100px_rgba(239,68,68,0.15)] animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowSupport(false)} className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>

            <div className="space-y-10">
              <div className="text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-red-600 to-amber-500 mx-auto mb-6 flex items-center justify-center shadow-xl shadow-red-900/40">
                  <UserPlus className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2">تلاشاني</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">تطوير البرمجيات الذكية</p>
              </div>
              
              <div className="space-y-4">
                <a href="tel:01140029315" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">اتصال مباشر</p>
                      <p className="font-black text-xl" dir="ltr">01140029315</p>
                    </div>
                  </div>
                </a>

                <a href="https://t.me/Tlashani" target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-blue-600/10 border border-blue-500/20 rounded-[1.5rem] hover:bg-blue-600/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">تليجرام</p>
                      <p className="font-black text-xl" dir="ltr">@Tlashani</p>
                    </div>
                  </div>
                </a>
              </div>

              <div className="pt-6 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black text-slate-700 tracking-[0.4em] uppercase">Cairo Shooting Range • 2024</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
