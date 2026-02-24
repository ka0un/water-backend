import ObservationStep from './ObservationStep';

export default function SedimentStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="sediment"
            question="Is there any sediment or particles in the water?"
            icon="🏜️"
            description="Look for anything settled at the bottom or floating inside."
            typeLabel="What type of sediment?"
            typeOptions={[
                { value: 'fine_particles', label: 'Fine Particles', icon: '🌫️', description: 'Dust-like' },
                { value: 'sand_grit', label: 'Sand / Grit', icon: '🏖️', description: 'Grainy texture' },
                { value: 'visible_chunks', label: 'Visible Chunks', icon: '🪨', description: 'Larger pieces' },
                { value: 'fibers', label: 'Fibers / Threads', icon: '🧵' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel="How much sediment?"
            amountOptions={[
                { value: 'trace', label: 'Trace', icon: '🔍', description: 'Barely visible' },
                { value: 'moderate', label: 'Moderate', icon: '📊', description: 'Clearly visible' },
                { value: 'heavy', label: 'Heavy', icon: '⚠️', description: 'Significant amount' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
        />
    );
}
