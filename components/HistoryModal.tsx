import React from 'react';
import { X, Clock, Trash2, ArrowRight, FileText, Building2, Calendar } from 'lucide-react';
import { SavedSession } from '../types';
import { Button } from './Button';

interface HistoryModalProps {
  sessions: SavedSession[];
  onLoad: (session: SavedSession) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ sessions, onLoad, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-indigo-200" />
            <div>
              <h2 className="text-xl font-bold">Role History</h2>
              <p className="text-indigo-100 text-xs opacity-90">Resume your previous applications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock size={32} className="opacity-50" />
              </div>
              <p className="text-lg font-medium text-gray-600">No saved history yet</p>
              <p className="text-sm max-w-xs mx-auto mt-2">Generate a career kit and click "Save" to keep track of different roles you apply for.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.sort((a, b) => b.timestamp - a.timestamp).map((session) => (
                <div key={session.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{session.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                         <span className="flex items-center gap-1.5">
                           <Calendar size={14} />
                           {new Date(session.timestamp).toLocaleDateString()}
                         </span>
                         {session.data.companyInput && (
                           <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-medium">
                             <Building2 size={12} />
                             {session.data.companyInput}
                           </span>
                         )}
                         <span className="flex items-center gap-1.5">
                           <FileText size={14} />
                           {session.data.assets ? 'Assets Generated' : 'Draft'}
                         </span>
                      </div>
                      <div className="text-xs text-gray-400 line-clamp-2">
                        {session.data.rawNotes.substring(0, 150)}...
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button onClick={() => onLoad(session)} className="text-sm py-2 px-4">
                        Open
                        <ArrowRight size={16} />
                      </Button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                        className="flex items-center justify-center gap-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};