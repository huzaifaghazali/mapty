import React, { useEffect, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useMap } from './hooks/useMap.js';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Map } from './components/map/Map.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';
import { Modal } from './components/common/Modal.jsx';
import { ToastProvider, useToast } from './contexts/ToastContext.jsx';
import { ModalProvider, useModal } from './contexts/ModalContext.jsx';
import { WorkoutProvider, useWorkouts } from './contexts/WorkoutContext.jsx';
import { FormProvider, useForm } from './contexts/FormContext.jsx';
import { WorkoutManager } from './components/workout/WorkoutManager.jsx';
import 'leaflet/dist/leaflet.css';

function ErrorBoundary({ children }) {
  return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>;
}

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.log(error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center h-screen bg-gray-100'>
          <div className='bg-white p-6 rounded-lg shadow-lg max-w-md'>
            <h2 className='text-xl font-semibold text-red-600 mb-2'>
              Something went wrong
            </h2>
            <p className='text-gray-600 mb-4'>
              An unexpected error occurred. Please refresh the page and try
              again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
function AppContent() {
  const { position } = useGeolocation();
  const { toasts, removeToast } = useToast();
  const { modal } = useModal();
  const {
    workouts,
    sortedWorkouts,
    workoutsLoaded,
    handleSortChange,
    fitAllWorkouts,
  } = useWorkouts();
  const {
    formVisible,
    formType,
    formValues,
    isEditing,
    handleTypeChange,
    setValues,
    closeForm,
  } = useForm();

  const mapInstanceRef = useRef(null);

  return (
    <WorkoutManager mapInstanceRef={mapInstanceRef}>
      {({
        handleMapClick,
        handleSubmit,
        handleEditWorkout,
        handleDeleteWorkout,
        handleDeleteAllWorkouts,
      }) => {
        const { mapRef, mapInstance, mapInitialized } = useMap(
          position,
          handleMapClick
        );

        // Update the ref with the map instance
        useEffect(() => {
          mapInstanceRef.current = mapInstance;
        }, [mapInstance]);

        return (
          <>
            <AppLayout
              formVisible={formVisible}
              formType={formType}
              onTypeChange={handleTypeChange}
              formValues={formValues}
              setValues={setValues}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              workouts={sortedWorkouts}
              mapRef={mapRef}
              isEditing={isEditing}
              onEditWorkout={handleEditWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onDeleteAllWorkouts={handleDeleteAllWorkouts}
              onSortChange={handleSortChange}
              onFitAllWorkouts={() =>
                fitAllWorkouts(mapInstanceRef.current?.current)
              }
            />
            <Map
              mapInstance={mapInstance}
              workouts={workouts}
              mapInitialized={mapInitialized && workoutsLoaded}
            />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <Modal
              isOpen={modal.isOpen}
              title={modal.title}
              message={modal.message}
              onConfirm={modal.onConfirm}
              onCancel={modal.onCancel}
              confirmText={modal.confirmText}
              cancelText={modal.cancelText}
              type={modal.type}
            />
          </>
        );
      }}
    </WorkoutManager>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ModalProvider>
          <WorkoutProvider>
            <FormProvider>
              <AppContent />
            </FormProvider>
          </WorkoutProvider>
        </ModalProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
