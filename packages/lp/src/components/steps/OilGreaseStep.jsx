import ObservationStep from './ObservationStep';

export default function OilGreaseStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="oilGrease"
            question="Is there oil or grease in the water?"
            icon="🛢️"
            description="Look for any sheen, film, or floating substance on the water surface."
            typeLabel="What type of oil do you see?"
            typeOptions={[
                { value: 'rainbow_sheen', label: 'Rainbow Sheen', icon: '🌈', description: 'Thin iridescent film' },
                { value: 'white_film', label: 'White / Cloudy Film', icon: '⬜' },
                { value: 'floating_droplets', label: 'Floating Droplets', icon: '💧', description: 'Visible oil drops' },
                { value: 'thick_layer', label: 'Thick Layer', icon: '🟫', description: 'Dense covering' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel="How much oil is present?"
            amountOptions={[
                { value: 'trace', label: 'Trace (< 1mm)', icon: '🔍', description: 'Very thin film' },
                { value: 'moderate', label: 'Moderate (1-5mm)', icon: '📊' },
                { value: 'heavy', label: 'Heavy (> 5mm)', icon: '⚠️', description: 'Thick coating' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
        />
    );
}
