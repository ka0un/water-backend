import ObservationStep from './ObservationStep';

export default function TrashStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="trashDebris"
            question="Is there trash or debris in the water?"
            icon="🗑️"
            description="Look for any floating or submerged waste materials."
            typeLabel="What type of trash?"
            typeOptions={[
                { value: 'plastic', label: 'Plastic', icon: '🥤', description: 'Bags, bottles, wrappers' },
                { value: 'organic', label: 'Organic Waste', icon: '🍌', description: 'Food, vegetation' },
                { value: 'metal', label: 'Metal', icon: '🔧', description: 'Cans, scraps' },
                { value: 'fabric', label: 'Fabric / Cloth', icon: '👕' },
                { value: 'construction', label: 'Construction Waste', icon: '🧱' },
                { value: 'mixed', label: 'Mixed / Various', icon: '♻️' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel="How much trash?"
            amountOptions={[
                { value: 'few_pieces', label: 'A Few Pieces', icon: '1️⃣' },
                { value: 'scattered', label: 'Scattered', icon: '📊', description: 'Multiple pieces' },
                { value: 'heavy', label: 'Heavy', icon: '⚠️', description: 'Large accumulation' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
        />
    );
}
