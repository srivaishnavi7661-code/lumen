import React, { useState } from 'react';
import { X, User, Mail, Linkedin, Phone, Calendar, Save, GraduationCap } from 'lucide-react';
import { User as UserType } from '../types';
import { Button } from './Button';

interface UserProfileProps {
  user: UserType;
  onClose: () => void;
  onSave: (updatedUser: UserType) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<UserType>(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-start text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">My Profile</h2>
              <p className="text-indigo-100 text-xs opacity-90">Manage your personal details</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  className={`${inputClasses} bg-gray-100 text-gray-500 cursor-not-allowed`}
                  value={formData.email}
                  disabled
                  readOnly
                />
                <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">LinkedIn Profile</label>
              <div className="relative">
                <input
                  type="url"
                  name="linkedin"
                  className={inputClasses}
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin || ''}
                  onChange={handleChange}
                />
                <Linkedin className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Mobile No.</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="mobile"
                    className={inputClasses}
                    placeholder="+1 234..."
                    value={formData.mobile || ''}
                    onChange={handleChange}
                  />
                  <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dob"
                    className={inputClasses}
                    value={formData.dob || ''}
                    onChange={handleChange}
                  />
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <Save size={18} />
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};