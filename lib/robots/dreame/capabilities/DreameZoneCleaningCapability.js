const DreameMapParser = require("../DreameMapParser");
const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");

const entities = require("../../../entities");

class DreameZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     *
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.start
     * @param {number} options.miot_actions.start.siid
     * @param {number} options.miot_actions.start.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mode
     * @param {object} options.miot_properties.mode.piid
     * @param {object} options.miot_properties.additionalCleanupParameters
     * @param {number} options.miot_properties.additionalCleanupParameters.piid
     *
     * @param {number} options.zoneCleaningModeId
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;

        this.zoneCleaningModeId = options.zoneCleaningModeId;
    }


    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        const FanSpeedStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.IntensityStateAttribute.name,
            attributeType: entities.state.attributes.IntensityStateAttribute.TYPE.FAN_SPEED
        });
        const WaterGradeAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.IntensityStateAttribute.name,
            attributeType: entities.state.attributes.IntensityStateAttribute.TYPE.WATER_GRADE
        });

        let fanSpeed = FanSpeedStateAttribute?.metaData?.rawValue ?? 1;
        let waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;

        const zones = [];

        valetudoZones.forEach((vZ, i) => {
            const pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(vZ.points.pA.x, vZ.points.pA.y);
            const pC = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(vZ.points.pC.x, vZ.points.pC.y);

            zones.push([
                pA.x,
                pA.y,

                pC.x,
                pC.y,

                vZ.iterations,
                fanSpeed,
                waterGrade
            ]);
        });

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.start.siid,
                aiid: this.miot_actions.start.aiid,
                in: [
                    {
                        piid: this.miot_properties.mode.piid,
                        value: this.zoneCleaningModeId
                    },
                    {
                        piid: this.miot_properties.additionalCleanupParameters.piid,
                        value: JSON.stringify({"areas": zones})
                    }
                ]
            }
        );

        if (res.code !== 0) {
            throw new Error("Error code " + res.code);
        }
    }

    /**
     * @returns {import("../../../core/capabilities/ZoneCleaningCapability").ZoneCleaningCapabilityProperties}
     */
    getProperties() {
        return {
            zoneCount: {
                min: 1,
                max: 1
            },
            iterationCount: {
                min: 1,
                max: 2
            }
        };
    }
}

module.exports = DreameZoneCleaningCapability;
