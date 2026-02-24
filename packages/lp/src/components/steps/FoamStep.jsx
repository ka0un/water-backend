import ObservationStep from './ObservationStep';

export default function FoamStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="foamBubbles"
            question="Is there foam or bubbles on the water?"
            icon="🫧"
            description="Check the surface for any foamy or bubbly areas."
            typeLabel="What type of foam?"
            typeOptions={[
                { value: 'small_bubbles', label: 'Small Bubbles', icon: '🫧', description: 'Tiny, natural-looking' },
                { value: 'white_foam', label: 'White Foam', icon: '🧼', description: 'Soapy appearance' },
                { value: 'thick_froth', label: 'Thick Froth', icon: '🍺', description: 'Dense foamy layer' },
                { value: 'colored_foam', label: 'Colored Foam', icon: '🎨', description: 'Unusual color' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel="How much foam is there?"
            amountOptions={[
                { value: 'trace', label: 'A Little', icon: '🔍' },
                { value: 'moderate', label: 'Moderate', icon: '📊' },
                { value: 'heavy', label: 'A Lot', icon: '⚠️', description: 'Covering most of surface' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
        />
    );
}
