import ObservationStep from './ObservationStep';

export default function PlantMatterStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="plantMatter"
            question="Is there plant matter in the water?"
            icon="🌿"
            description="Check for leaves, roots, or other vegetation."
            typeLabel="What type of plant matter?"
            typeOptions={[
                { value: 'leaves', label: 'Leaves', icon: '🍃' },
                { value: 'roots', label: 'Roots', icon: '🌱' },
                { value: 'grass', label: 'Grass / Weeds', icon: '🌾' },
                { value: 'moss', label: 'Moss', icon: '🌿' },
                { value: 'decaying', label: 'Decaying Vegetation', icon: '🍂' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel=""
            amountOptions={[]}
        />
    );
}
