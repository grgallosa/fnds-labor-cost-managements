
import React, { useState, useRef } from 'react';
import { Task, PaymentRequest, PaymentStatus, PaymentProfile, PaymentMethod, TaskStatus, SubTask } from '../../types';
import { supabase, uploadImage } from '../../lib/supabase';
import { MapPin, Calendar, Clock, ChevronRight, X, Smartphone, CheckCircle, Camera, MapPinned, Loader2, Package, ArrowLeft, AlertTriangle, Landmark } from 'lucide-react';

interface Props {
  tasks: Task[];
  setTasks: (tasks: any) => void;
  requests: PaymentRequest[];
  userId: string;
  setRequests: (requests: any) => void;
  profile: PaymentProfile;
}

export default function EmployeeTasks({ tasks, setTasks, requests, userId, setRequests, profile }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<'AVAILABLE' | 'MY_TASKS'>('AVAILABLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetCompletionFlow = () => {
    setIsCompleting(false);
    setLocationVerified(false);
    setIsGettingLocation(false);
    setCompletionPhoto(null);
  };

  const handleTakeTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: TaskStatus.IN_PROGRESS, 
          assigned_to: userId 
        })
        .eq('id', task.id);
      
      if (error) throw error;
      setSelectedTask(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationVerified(true);
        setIsGettingLocation(false);
      },
      () => {
        alert("Please allow location access to verify site presence.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCompletionPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async (task: Task) => {
    if (!locationVerified || !completionPhoto) return;
    setIsSubmitting(true);
    
    try {
      // 1. Upload photo to storage first
      const photoUrl = await uploadImage('fnds_uploads', `proofs/${task.id}_${Date.now()}.jpg`, completionPhoto);

      // 2. Update task record
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: TaskStatus.DONE, 
          completion_photo: photoUrl,
          completion_location_verified: locationVerified,
          rejection_reason: null
        })
        .eq('id', task.id);
      
      if (error) throw error;
      setSelectedTask(null);
      resetCompletionFlow();
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTasks = tasks.filter(t => t.status === TaskStatus.OPEN);
  const myTasks = tasks.filter(t => t.assignedTo === userId && t.status !== TaskStatus.PAID);
  const displayTasks = view === 'AVAILABLE' ? availableTasks : myTasks;

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setView('AVAILABLE'); resetCompletionFlow(); }}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
            view === 'AVAILABLE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          Jobs ({availableTasks.length})
        </button>
        <button 
          onClick={() => { setView('MY_TASKS'); resetCompletionFlow(); }}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
            view === 'MY_TASKS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          My Work ({myTasks.length})
        </button>
      </div>

      <div className="space-y-4">
        {displayTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <Clock size={32} className="mx-auto mb-4 text-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Tasks</p>
          </div>
        ) : (
          displayTasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => { setSelectedTask(task); resetCompletionFlow(); }}
              className={`p-5 bg-white border rounded-2xl shadow-sm active:scale-[0.98] cursor-pointer hover:border-indigo-100 transition-all ${
                task.rejectionReason ? 'border-red-100 bg-red-50/10' : 'border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-lg font-bold text-slate-900">₱{task.amount.toFixed(2)}</span>
                <div className="flex gap-2">
                  {task.isBatch && (
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                      Batch
                    </span>
                  )}
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                    task.status === TaskStatus.OPEN ? 'bg-green-50 text-green-600' : 
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' : 
                    task.status === TaskStatus.DONE ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 truncate">{task.title}</h3>
              
              {task.rejectionReason && (
                <div className="flex items-center gap-1.5 text-red-500 font-bold text-[9px] uppercase tracking-wider mb-4 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertTriangle size={12} />
                  Requires Correction
                </div>
              )}

              <div className="flex items-center justify-between text-indigo-600 font-bold text-[10px] uppercase tracking-widest pt-3 border-t border-slate-50">
                <span>View Details</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail / Complete Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            
            <button 
              onClick={() => { setSelectedTask(null); resetCompletionFlow(); }} 
              className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            {!isCompleting ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Work Order</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{selectedTask.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedTask.description || 'No additional instructions provided.'}</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <MapPin size={16} className="text-indigo-600 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{selectedTask.location}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Calendar size={16} className="text-indigo-600 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
                      <p className="text-sm font-bold text-slate-900">{new Date(selectedTask.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.2em] mb-1">Payout</p>
                      <p className="text-3xl font-black">₱{selectedTask.amount.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                      <Landmark size={24} />
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    {selectedTask.status === TaskStatus.OPEN && (
                      <button 
                        onClick={() => handleTakeTask(selectedTask)}
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-xl shadow-indigo-100"
                      >
                        Accept Task
                      </button>
                    )}

                    {selectedTask.status === TaskStatus.IN_PROGRESS && (
                      <button 
                        onClick={() => setIsCompleting(true)}
                        className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-xl shadow-emerald-100"
                      >
                        Submit Completion
                      </button>
                    )}

                    <button 
                      onClick={() => { setSelectedTask(null); resetCompletionFlow(); }}
                      className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      Back to list
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right duration-300">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Final Review</h3>
                  <p className="text-sm text-slate-500 font-medium">Please provide the required proof of work.</p>
                </div>

                <div className="space-y-6">
                  <div className={`p-6 rounded-[2rem] border-2 transition-all ${locationVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
                        <MapPinned size={20} />
                      </div>
                      {locationVerified && <CheckCircle className="text-emerald-500" size={24} />}
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">GPS Verification</h4>
                    <p className="text-xs text-slate-500 mb-4">Confirm you are at the designated worksite.</p>
                    <button 
                      onClick={handleVerifyLocation}
                      disabled={isGettingLocation || locationVerified}
                      className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 flex items-center justify-center gap-2 shadow-sm active:bg-slate-50 disabled:opacity-50"
                    >
                      {isGettingLocation ? <Loader2 className="animate-spin" size={16} /> : 'Verify Now'}
                    </button>
                  </div>

                  <div className={`p-6 rounded-[2rem] border-2 transition-all ${completionPhoto ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
                        <Camera size={20} />
                      </div>
                      {completionPhoto && <CheckCircle className="text-emerald-500" size={24} />}
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Worksite Photo</h4>
                    <p className="text-xs text-slate-500 mb-4">Upload a clear photo of the completed task.</p>
                    
                    {completionPhoto ? (
                      <div className="relative group">
                        <img src={completionPhoto} className="w-full h-32 object-cover rounded-xl border border-white shadow-md" />
                        <button 
                          onClick={() => setCompletionPhoto(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 flex items-center justify-center gap-2 shadow-sm active:bg-slate-50"
                      >
                        Capture Image
                      </button>
                    )}
                    <input type="file" ref={cameraInputRef} onChange={handlePhotoCapture} className="hidden" accept="image/*" capture="environment" />
                  </div>

                  <div className="pt-4">
                    <button 
                      disabled={!locationVerified || !completionPhoto || isSubmitting}
                      onClick={() => handleFinalSubmit(selectedTask)}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg active:scale-95 disabled:opacity-30 shadow-xl shadow-indigo-100"
                    >
                      {isSubmitting ? 'Syncing...' : 'Submit Evidence'}
                    </button>
                    <button 
                      onClick={() => setIsCompleting(false)} 
                      className="w-full mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
