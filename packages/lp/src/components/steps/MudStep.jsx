import ObservationStep from './ObservationStep';

export default function MudStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="mudSilt"
            question="Is there mud or silt in the water?"
            icon="🟤"
            description="Check if the water looks muddy or has silt buildup."
            typeLabel=""
            typeOptions={[]}
            amountLabel="How severe is the muddiness?"
            amountOptions={[
                { value: 'slight', label: 'Slight', icon: '🔍', description: 'Just a tint' },
                { value: 'moderate', label: 'Moderate', icon: '📊', description: 'Clearly muddy' },
                { value: 'heavy', label: 'Very Muddy', icon: '⚠️', description: 'Opaque brown water' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
        />
    );
}
