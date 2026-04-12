const waterSourceValidation = require('../../validations/waterSource.validation');

describe('WaterSource validation unit tests', () => {
    describe('createWaterSource.body', () => {
        it('accepts a valid payload', () => {
            const payload = {
                name: 'Community Well',
                type: 'Well',
                location: { latitude: 6.9271, longitude: 79.8612 },
                operational_status: 'Functional',
                access_type: 'Public',
                description: 'Main public source',
            };

            const { error } = waterSourceValidation.createWaterSource.body.validate(payload);

            expect(error).toBeUndefined();
        });

        it('rejects invalid latitude', () => {
            const payload = {
                name: 'Bad Lat Well',
                type: 'Well',
                location: { latitude: 120, longitude: 79.8612 },
            };

            const { error } = waterSourceValidation.createWaterSource.body.validate(payload);

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('latitude');
        });
    });

    describe('updateWaterSource.body', () => {
        it('rejects empty update payload', () => {
            const { error } = waterSourceValidation.updateWaterSource.body.validate({});

            expect(error).toBeDefined();
            expect(error.details[0].type).toBe('object.min');
        });
    });

    describe('getNearbySources.query', () => {
        it('rejects radius larger than 50km', () => {
            const { error } = waterSourceValidation.getNearbySources.query.validate({
                latitude: 6.9271,
                longitude: 79.8612,
                radius: 50001,
            });

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('radius');
        });
    });
});
