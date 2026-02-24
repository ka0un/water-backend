import ObservationStep from './ObservationStep';

export default function WildlifeStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="deadWildlife"
            question="Have you seen dead animals near or in the water?"
            icon="⚠️"
            description="Dead fish or animals can indicate serious contamination."
            typeLabel="What type of animal?"
            typeOptions={[
                { value: 'fish', label: 'Fish', icon: '🐟' },
                { value: 'frogs', label: 'Frogs / Amphibians', icon: '🐸' },
                { value: 'birds', label: 'Birds', icon: '🐦' },
                { value: 'small_mammals', label: 'Small Mammals', icon: '🐀' },
                { value: 'other', label: 'Other', icon: '🦎' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel=""
            amountOptions={[]}
        />
    );
}
