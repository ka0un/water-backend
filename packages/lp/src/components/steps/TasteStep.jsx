import ObservationStep from './ObservationStep';

const TYPE_OPTIONS = [
    { value: 'salty', label: 'Salty', icon: '🧂' },
    { value: 'bitter', label: 'Bitter', icon: '😝' },
    { value: 'metallic', label: 'Metallic', icon: '🔩' },
    { value: 'sweet', label: 'Sweet', icon: '🍬' },
    { value: 'sour', label: 'Sour / Acidic', icon: '🍋' },
    { value: 'chemical', label: 'Chemical', icon: '⚗️' },
    { value: 'not_sure', label: 'Not Sure', icon: '❓' },
];

export default function TasteStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="taste"
            question="Does the water taste unusual?"
            icon="👅"
            description="⚠️ Only taste if you believe the water is safe to try."
            typeLabel="What kind of taste?"
            typeOptions={TYPE_OPTIONS}
            amountOptions={[]}
        />
    );
}
