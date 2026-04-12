const mongoose = require('mongoose');
const WaterSource = require('../../models/WaterSource.model');

describe('WaterSource model unit tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('checkDuplicateNearby', () => {
        it('returns true when an existing source is found nearby', async () => {
            jest.spyOn(WaterSource, 'findOne').mockResolvedValue({ _id: 'existing' });

            const result = await WaterSource.checkDuplicateNearby(79.8612, 6.9271, 20);

            expect(result).toBe(true);
            expect(WaterSource.findOne).toHaveBeenCalledWith({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [79.8612, 6.9271],
                        },
                        $maxDistance: 20,
                    },
                },
                is_deleted: false,
            });
        });

        it('returns false when no existing source is found nearby', async () => {
            jest.spyOn(WaterSource, 'findOne').mockResolvedValue(null);

            const result = await WaterSource.checkDuplicateNearby(79.8612, 6.9271, 20);

            expect(result).toBe(false);
        });
    });

    describe('findNearby', () => {
        it('builds a geospatial query and populates creator info', async () => {
            const expected = [{ name: 'Well A' }];
            const populate = jest.fn().mockResolvedValue(expected);
            jest.spyOn(WaterSource, 'find').mockReturnValue({ populate });

            const result = await WaterSource.findNearby(79.8612, 6.9271, 5000, { type: 'Well' });

            expect(WaterSource.find).toHaveBeenCalledWith({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [79.8612, 6.9271],
                        },
                        $maxDistance: 5000,
                    },
                },
                is_deleted: false,
                type: 'Well',
            });
            expect(populate).toHaveBeenCalledWith('created_by', 'name email');
            expect(result).toBe(expected);
        });
    });

    describe('softDelete', () => {
        it('marks source as deleted and stores user reference', async () => {
            const deletedBy = new mongoose.Types.ObjectId();
            const source = new WaterSource({
                name: 'Unit Test Well',
                type: 'Well',
                location: { type: 'Point', coordinates: [79.86, 6.92] },
                created_by: new mongoose.Types.ObjectId(),
            });

            source.save = jest.fn().mockResolvedValue(source);

            await source.softDelete(deletedBy);

            expect(source.is_deleted).toBe(true);
            expect(source.deleted_by.toString()).toBe(deletedBy.toString());
            expect(source.deleted_at).toBeInstanceOf(Date);
            expect(source.save).toHaveBeenCalledTimes(1);
        });
    });
});
