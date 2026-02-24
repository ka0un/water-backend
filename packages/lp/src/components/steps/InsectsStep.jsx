import ObservationStep from './ObservationStep';

export default function InsectsStep(props) {
    return (
        <ObservationStep
            {...props}
            fieldName="insectsLarvae"
            question="Are there insects or larvae in the water?"
            icon="🦟"
            description="Look carefully for any living creatures in or on the water."
            typeLabel="What type of insects?"
            typeOptions={[
                { value: 'mosquito_larvae', label: 'Mosquito Larvae', icon: '🦟', description: 'Small wriggling worms' },
                { value: 'flies', label: 'Flies / Gnats', icon: '🪰' },
                { value: 'beetles', label: 'Water Beetles', icon: '🪲' },
                { value: 'worms', label: 'Worms', icon: '🪱' },
                { value: 'other', label: 'Other Insects', icon: '🐛' },
                { value: 'not_sure', label: 'Not Sure', icon: '❓' },
            ]}
            amountLabel=""
            amountOptions={[]}
        />
    );
}
