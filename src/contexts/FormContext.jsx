import { createContext, useContext, useState, useCallback } from 'react';

const FormContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useForm() {
  return useContext(FormContext);
}

export function FormProvider({ children }) {
  const [formVisible, setFormVisible] = useState(false);
  const [formType, setFormType] = useState('running');
  const [formValues, setFormValues] = useState({
    distance: '',
    duration: '',
    cadence: '',
    elevation: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);

  const openForm = useCallback((type = 'running') => {
    setFormVisible(true);
    setFormType(type);
    setIsEditing(false);
    setEditingWorkoutId(null);
    setFormValues({
      distance: '',
      duration: '',
      cadence: '',
      elevation: '',
    });
  }, []);

  const closeForm = useCallback(() => {
    setFormVisible(false);
    setIsEditing(false);
    setEditingWorkoutId(null);
    setFormValues({
      distance: '',
      duration: '',
      cadence: '',
      elevation: '',
    });
  }, []);

  const openEditForm = useCallback((workout) => {
    setFormVisible(true);
    setIsEditing(true);
    setEditingWorkoutId(workout.id);
    setFormType(workout.type);

    // Populate form with workout data
    setFormValues({
      distance: workout.distance.toString(),
      duration: workout.duration.toString(),
      cadence: workout.cadence ? workout.cadence.toString() : '',
      elevation: workout.elevationGain ? workout.elevationGain.toString() : '',
    });
  }, []);

  const handleTypeChange = useCallback((e) => {
    setFormType(e.target.value);
  }, []);

  const handleValueChange = useCallback((fieldOrUpdater, value) => {
    // Handle both object updater and field/value patterns
    if (typeof fieldOrUpdater === 'function') {
      setFormValues(fieldOrUpdater);
    } else {
      setFormValues((prev) => ({ ...prev, [fieldOrUpdater]: value }));
    }
  }, []);

  const setValues = useCallback((updater) => {
    setFormValues(updater);
  }, []);

  const value = {
    formVisible,
    formType,
    formValues,
    isEditing,
    editingWorkoutId,
    openForm,
    closeForm,
    openEditForm,
    handleTypeChange,
    handleValueChange,
    setValues,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}
