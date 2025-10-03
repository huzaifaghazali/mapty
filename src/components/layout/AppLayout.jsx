import { Sidebar } from '../common/Sidebar.jsx';
import { Logo } from '../common/Logo.jsx';
import { WorkoutForm } from '../form/WorkoutForm.jsx';
import { WorkoutsList } from '../workout/WorkoutsList.jsx';

export function AppLayout({
  formVisible,
  formType,
  onTypeChange,
  formValues,
  setValues,
  onSubmit,
  onCancel,
  workouts,
  mapRef,
  isEditing,
  onEditWorkout,
  onDeleteWorkout,
  onDeleteAllWorkouts,
}) {
  return (
    <div className='flex h-[95vh]'>
      <Sidebar>
        <Logo />
        <WorkoutForm
          visible={formVisible}
          type={formType}
          onTypeChange={onTypeChange}
          values={formValues}
          setValues={setValues}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isEditing={isEditing}
        />
        <WorkoutsList
          workouts={workouts}
          onEditWorkout={onEditWorkout}
          onDeleteWorkout={onDeleteWorkout}
        />

        {/* Delete All Button */}
        {workouts.length > 0 && (
          <div className='flex justify-end mb-[1rem]'>
            <button
              onClick={onDeleteAllWorkouts}
              className='px-[1.5rem] py-[0.5rem] bg-red-600 text-white text-[1.4rem] font-medium rounded-[10px] transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
            >
              Delete All
            </button>
          </div>
        )}

        <p className='mt-auto text-[1.3rem] text-center text-light1'>
          &copy; Copyright by{' '}
          <a
            className='text-light1 transition-all duration-200 hover:text-[#ececec]'
            href='https://github.com/huzaifaghazali '
            target='_blank'
            rel='noopener noreferrer'
          >
            Huzaifa Ghazali
          </a>
          . Made with love ♥️.
        </p>
      </Sidebar>

      <div id='map' ref={mapRef} className='flex-1 h-full bg-[#aaa]' />

      <style>{`
        .leaflet-popup .leaflet-popup-content-wrapper {
          background-color: #2d3439;
          color: #ececec;
          border-radius: 5px;
          padding-right: 0.6rem;
        }
        .leaflet-popup .leaflet-popup-content {
          font-size: 1.5rem;
        }
        .leaflet-popup .leaflet-popup-tip {
          background-color: #2d3439;
        }
        .running-popup .leaflet-popup-content-wrapper {
          border-left: 5px solid #00c46a;
        }
        .cycling-popup .leaflet-popup-content-wrapper {
          border-left: 5px solid #ffb545;
        }
      `}</style>
    </div>
  );
}
