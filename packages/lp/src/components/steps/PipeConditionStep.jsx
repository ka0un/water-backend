import ObservationStep from './ObservationStep';

export default function PipeConditionStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="pipeCondition"
            question="Is there visible rust or corrosion on pipes?"
            icon="🔧"
            description="Check pipes, taps, or fittings connected to the water source."
            typeLabel=""
            typeOptions={[]}
            amountLabel="How severe is the corrosion?"
            amountOptions={[
                { value: 'slight', label: 'Slight', icon: '🔍', description: 'Minor discoloration' },
                { value: 'moderate', label: 'Moderate', icon: '📊', description: 'Clear rust patches' },
                { value: 'severe', label: 'Severe', icon: '⚠️', description: 'Heavy corrosion / flaking' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
        />
    );
}
