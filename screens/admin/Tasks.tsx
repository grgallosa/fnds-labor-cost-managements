
import React, { useState } from 'react';
import { Task, TaskStatus, PaymentMethod } from '../../types';
import { 
  Plus, X, MapPin, Calendar, Trash2, 
  CheckCircle2, FileText, Layers, 
  AlertCircle, Package, Edit3, Save, ChevronRight, AlertTriangle, Landmark, Smartphone
} from 'lucide-react';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const PREDEFINED_AMOUNTS = [50, 100, 200, 500];

interface DraftSubTask {
  tempId: string;
  title: string;
  description: string;
  amount: string;
}

type CreationMode = 'SINGLE' | 'BATCH';

export default function AdminTasks({ tasks, setTasks }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>('SINGLE');
  const [draftSubTasks, setDraftSubTasks] = useState<DraftSubTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [formData, setFormData] = useState({
    batchTitle: '',
    title: '',
    description: '',
    amount: '100',
    date: new Date().toISOString().split('T')[0],
    location: '',
    paymentMethod: PaymentMethod.CASH
  });

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handleEditClick = (task: Task) => {
    setIsConfirmingDelete(false);
    setSelectedTask(task);
    setIsAdding(false);
    setFormData({
      batchTitle: task.isBatch ? task.title : '',
      title: task.isBatch ? '' : task.title,
      description: task.description || '',
      amount: task.amount.toString(),
      date: new Date(task.date).toISOString().split('T')[0],
      location: task.location,
      paymentMethod: task.paymentMethod || PaymentMethod.CASH
    });
    if (task.isBatch && task.subTasks) {
      setDraftSubTasks(task.subTasks.map(s => ({
        tempId: s.id,
        title: s.title,
        description: s.description,
        amount: s.amount.toString()
      })));
    } else {
      setDraftSubTasks([]);
    }
    setIsCustomAmount(!PREDEFINED_AMOUNTS.includes(task.amount));
  };

  const handleAddSubTask = () => {
    if (!formData.title || !formData.amount) {
      setError("Sub-task requires Title and Amount");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newDraft: DraftSubTask = {
      tempId: generateId('sub'),
      title: formData.title,
      description: formData.description,
      amount: formData.amount
    };

    setDraftSubTasks(prev => [...prev, newDraft]);
    setError(null);
    setFormData(prev => ({ ...prev, title: '', description: '' }));
  };

  const removeFromDraft = (tempId: string) => {
    setDraftSubTasks(prev => prev.filter(t => t.tempId !== tempId));
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (selectedTask) {
      if (selectedTask.isBatch) {
        if (!formData.batchTitle || !formData.location || (draftSubTasks.length === 0 && !formData.title)) {
          setError("Batch needs title, location and at least one item.");
          return;
        }
      } else {
        if (!formData.title || !formData.amount || !formData.location) {
          setError("Complete all required fields");
          return;
        }
      }
    } else {
      if (creationMode === 'SINGLE') {
        if (!formData.title || !formData.amount || !formData.location) {
          setError("Complete all required fields");
          return;
        }
      } else {
        if (!formData.batchTitle || !formData.location || (draftSubTasks.length === 0 && !formData.title)) {
          setError("Batch requires title, location and items");
          return;
        }
      }
    }

    if (selectedTask) {
      const updatedTasks = tasks.map(t => {
        if (t.id === selectedTask.id) {
          const finalDraftsForUpdate = [...draftSubTasks];
          if (formData.title && formData.amount && t.isBatch) {
              finalDraftsForUpdate.push({ tempId: generateId('edit-sub'), title: formData.title, description: formData.description, amount: formData.amount });
          }

          const totalAmount = t.isBatch 
            ? finalDraftsForUpdate.reduce((sum, s) => {
                const val = parseFloat(s.amount || '0');
                return sum + (isNaN(val) ? 0 : val);
              }, 0)
            : parseFloat(formData.amount || '0');

          return {
            ...t,
            title: t.isBatch ? formData.batchTitle : formData.title,
            description: formData.description,
            amount: totalAmount,
            date: new Date(formData.date).toISOString(),
            location: formData.location,
            paymentMethod: formData.paymentMethod,
            subTasks: t.isBatch ? finalDraftsForUpdate.map(s => ({
              id: s.tempId,
              title: s.title,
              description: s.description,
              amount: parseFloat(s.amount || '0')
            })) : undefined
          };
        }
        return t;
      });
      setTasks(updatedTasks);
    } else {
      if (creationMode === 'SINGLE') {
        const newTask: Task = {
          id: generateId('t'),
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount || '0'),
          date: new Date(formData.date).toISOString(),
          location: formData.location,
          status: TaskStatus.OPEN,
          createdBy: '1',
          createdAt: new Date().toISOString(),
          paymentMethod: formData.paymentMethod
        };
        setTasks(prev => [newTask, ...prev]);
      } else {
        const finalSubTasks = [...draftSubTasks];
        if (formData.title && formData.amount) {
          finalSubTasks.push({ tempId: generateId('new-sub'), title: formData.title, description: formData.description, amount: formData.amount });
        }
        const totalAmount = finalSubTasks.reduce((sum, s) => {
          const val = parseFloat(s.amount || '0');
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        const newBatchTask: Task = {
          id: generateId('b'),
          title: formData.batchTitle,
          description: `Batch task with ${finalSubTasks.length} items.`,
          amount: totalAmount,
          date: new Date(formData.date).toISOString(),
          location: formData.location,
          status: TaskStatus.OPEN,
          createdBy: '1',
          createdAt: new Date().toISOString(),
          isBatch: true,
          paymentMethod: formData.paymentMethod,
          subTasks: finalSubTasks.map(s => ({
            id: s.tempId,
            title: s.title,
            description: s.description,
            amount: parseFloat(s.amount || '0')
          }))
        };
        setTasks(prev => [newBatchTask, ...prev]);
      }
    }

    closeModal();
  };

  const handleFinalDelete = () => {
    if (!selectedTask) return;
    const taskIdToDelete = selectedTask.id;
    setTasks(prev => prev.filter(t => t.id !== taskIdToDelete));
    closeModal();
  };

  const closeModal = () => {
    setIsAdding(false);
    setSelectedTask(null);
    setIsConfirmingDelete(false);
    resetForm();
  };

  const resetForm = () => {
    setDraftSubTasks([]);
    setError(null);
    setFormData({ batchTitle: '', title: '', description: '', amount: '100', date: new Date().toISOString().split('T')[0], location: '', paymentMethod: PaymentMethod.CASH });
    setIsCustomAmount(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active Tasks</h2>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); setCreationMode('SINGLE'); }}
          className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">Create</span>
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => handleEditClick(task)}
            className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-indigo-100"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                  task.status === TaskStatus.OPEN ? 'bg-green-50 text-green-600' : 
                  task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' : 
                  task.status === TaskStatus.DONE ? 'bg-orange-50 text-orange-600' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.isBatch && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 flex items-center gap-1">
                    <Package size={10} />
                    Batch ({task.subTasks?.length})
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-900">₱{task.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{task.title}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.description}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
            </div>
            <div className="flex gap-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest overflow-hidden">
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar size={12} />
                <span>{new Date(task.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin size={12} />
                <span className="truncate">{task.location}</span>
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
            <FileText size={32} className="mx-auto text-gray-100 mb-4" />
            <p className="text-xs text-gray-400 font-medium">No tasks found</p>
          </div>
        )}
      </div>

      {/* Detail / Create Modal */}
      {(isAdding || selectedTask) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-2">
                {selectedTask ? <Edit3 size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />}
                <h3 className="text-lg font-bold">{selectedTask ? 'Edit Task' : 'New Task'}</h3>
              </div>
              <button 
                type="button"
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {!selectedTask && (
              <div className="flex p-1 bg-gray-100 rounded-xl mb-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreationMode('SINGLE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    creationMode === 'SINGLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  <FileText size={14} />
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('BATCH')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    creationMode === 'BATCH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  <Layers size={14} />
                  Batch
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-6 scrollbar-hide">
              <div className="p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 space-y-4">
                {(creationMode === 'BATCH' || selectedTask?.isBatch) && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Batch Group Title *</label>
                    <input className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-sm focus:border-indigo-500 transition-all" placeholder="e.g. Loading Crew A" value={formData.batchTitle} onChange={e => setFormData({...formData, batchTitle: e.target.value})} />
                  </div>
                )}

                {(!selectedTask?.isBatch && creationMode === 'SINGLE') || (selectedTask && !selectedTask.isBatch) ? (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Title *</label>
                    <input className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-sm focus:border-indigo-500 transition-all" placeholder="Task Name" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                ) : null}
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-sm min-h-[60px]" placeholder="Extra instructions..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                    <input type="date" className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-sm text-gray-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Location *</label>
                    <input className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-sm" placeholder="Site Name" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: PaymentMethod.CASH})}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        formData.paymentMethod === PaymentMethod.CASH ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      <Landmark size={20} />
                      <span className="text-[10px] font-bold uppercase">Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: PaymentMethod.EWALLET})}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        formData.paymentMethod === PaymentMethod.EWALLET ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      <Smartphone size={20} />
                      <span className="text-[10px] font-bold uppercase">GCash</span>
                    </button>
                  </div>
                </div>

                {(!selectedTask?.isBatch && creationMode === 'SINGLE') && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Payout (₱)</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {PREDEFINED_AMOUNTS.map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setFormData({...formData, amount: amt.toString()}); setIsCustomAmount(false); }}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            !isCustomAmount && formData.amount === amt.toString() 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'
                          }`}
                        >
                          ₱{amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setIsCustomAmount(true)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          isCustomAmount 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                    
                    {isCustomAmount && (
                      <div className="relative animate-in slide-in-from-top duration-200">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₱</span>
                        <input 
                          type="number" 
                          className="w-full p-3 pl-10 bg-white border border-indigo-100 rounded-xl outline-none font-medium text-sm focus:border-indigo-500 transition-all" 
                          placeholder="Amount" 
                          value={formData.amount} 
                          onChange={e => setFormData({...formData, amount: e.target.value})} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(creationMode === 'BATCH' || selectedTask?.isBatch) && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-1">Add Items to Batch</h4>
                    <div>
                      <input className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-xs mb-2" placeholder="Item Name (e.g. Area A)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₱</span>
                          <input type="number" className="w-full p-3 pl-8 bg-white border border-gray-100 rounded-xl outline-none font-medium text-xs" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        <button 
                          type="button"
                          onClick={handleAddSubTask}
                          className="bg-indigo-600 text-white px-4 rounded-xl text-xs font-bold transition-all active:scale-95"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {draftSubTasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batch Items ({draftSubTasks.length})</h4>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                          Total: ₱{draftSubTasks.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {draftSubTasks.map((draft) => (
                          <div key={draft.tempId} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-900 truncate">{draft.title}</p>
                              <p className="text-[9px] text-gray-500 font-medium">₱{parseFloat(draft.amount).toFixed(2)}</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => removeFromDraft(draft.tempId)} className="p-2 text-red-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-2 mb-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase animate-in fade-in duration-300">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            <div className="shrink-0 pt-4 border-t border-gray-100 bg-white space-y-3 safe-bottom">
              {isConfirmingDelete ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-[1.5rem] animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="text-xs font-bold text-red-900 leading-tight">Delete this task permanently? This cannot be undone.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleFinalDelete}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-100"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
                  >
                    {selectedTask ? <Save size={18} /> : <CheckCircle2 size={18} />}
                    {selectedTask ? 'Save Changes' : (creationMode === 'SINGLE' ? 'Publish Task' : 'Publish Batch')}
                  </button>
                  
                  {selectedTask && (
                    <button 
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete Task
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
