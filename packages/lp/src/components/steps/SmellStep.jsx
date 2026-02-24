import ObservationStep from './ObservationStep';

const TYPE_OPTIONS = [
    { value: 'earthy', label: 'Earthy / Musty', icon: '🍂' },
    { value: 'chlorine', label: 'Chlorine / Bleach', icon: '🧪' },
    { value: 'sulfur', label: 'Sulfur / Rotten Egg', icon: '🥚' },
    { value: 'chemical', label: 'Chemical', icon: '⚗️' },
    { value: 'metallic', label: 'Metallic', icon: '🔩' },
    { value: 'fishy', label: 'Fishy', icon: '🐟' },
    { value: 'sewage', label: 'Sewage', icon: '🚽' },
    { value: 'not_sure', label: 'Not Sure', icon: '❓' },
];

const INTENSITY_OPTIONS = [
    { value: 'faint', label: 'Faint', icon: '😶', description: 'Barely noticeable' },
    { value: 'moderate', label: 'Moderate', icon: '😐', description: 'Clearly noticeable' },
    { value: 'strong', label: 'Strong', icon: '😖', description: 'Very unpleasant' },
    { value: 'not_sure', label: 'Not Sure', icon: '❓' },
];

export default function SmellStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="smell"
            question="Does the water have an unusual smell?"
            icon="👃"
            description="Bring the water close (without touching) and check for any odor."
            typeLabel="What kind of smell?"
            typeOptions={TYPE_OPTIONS}
            amountLabel="How strong is the smell?"
            amountOptions={INTENSITY_OPTIONS}
        />
    );
}
