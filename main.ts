enum ColorEvent {
    //% block=black
    Black = 1,
    //% block=red
    R = 2,
    //% block=green
    G = 3,
    //% block=blue
    B = 4,
    //% block=others
    Other = 5
};

enum LinerEvent {
    //% block=middle
    Middle = 1,
    //% block=left
    Left = 3,
    //% block=leftmost
    Leftmost = 4,
    //% block=right
    Right = 5,
    //% block=rightmost
    Rightmost = 6,
    //% block=lost
    Lost = 2
};

enum MotorTpye {
    //% block=servo
    Servo = 0x24,
    //% block=wheel
    Wheel = 0x28
};

enum SpeedTpye {
    //% block=slow
    Slow = 1,
    //% block=medium
    Medium = 2,
    //% block=fast
    Fast = 3
};

enum DirectionTpye {
    //% block=forward
    Forward = 1,
    //% block=backward
    Backward = 2,
    //% block=left
    Left = 3,
    //% block=right
    Right = 4,
    //% block=clockwise
    Clockwise = 5,
    //% block=counter-clockwise
    Anticlockwise = 6
};

enum MotionTpye {
    //% block="random direction"
    Random = 0,
    //% block=automatically
    Auto = 1
};

/**
 * Functions to operate G0 module.
 */
//% weight=48 color=#A26236 icon="\uf018" block="Bit:micro"
namespace Bitmicro {

    /**
     * Do something when the color sensor detects a specific color.
     * @param event type of color to detect
     * @param handler code to run
     */
    //% blockId=sensor_color_create_event block="on color|%event"
    //% weight=94 blockGap=8
    export function onColor(event: ColorEvent, handler: Action) {
        const eventId = driver.subscribeToEventSource(SensorType.Liner);
        control.onEvent(eventId, event, handler);
    }

    export let linerEventValue = 0;
    const eventIdLiner = 9000;
    let initLiner = false;
    let lastLiner = 0;

    /**
     * Do something when the line follower recognized the position of the line underneath.
     * @param event type of liner to detect
     * @param handler code to run
     */
    //% blockId=sensor_liner_create_event block="on line position|%event"
    //% weight=95 blockGap=8
    export function onLinePosition(event: LinerEvent, handler: Action) {
        control.onEvent(eventIdLiner, event, handler);
        if (!initLiner) {
            initLiner = true;
            control.inBackground(() => {
                while (true) {
                    driver.i2cSendByte(SensorType.Liner, 0x02);
                    const event = driver.i2cReceiveByte(SensorType.Liner);
                    if (event > 2) linerEventValue = event;
                    if (event != lastLiner) {
                        lastLiner = event;
                        control.raiseEvent(eventIdLiner, lastLiner);
                    }
                    basic.pause(50);
                }
            })
        }
    }

    /**
     * Get the color value from the color sensor in R:G:B.
     */
    //% blockId=sensor_get_color_rgb block="color"
    //% weight=94 blockGap=8
    export function getColor(): number {
        let data: Buffer = pins.createBuffer(4);
        driver.i2cSendByte(SensorType.Liner, 0x04);
        data = driver.i2cReceiveBytes(SensorType.Liner, 4);
        return (data[0] + data[1] * 256 + data[2] * 65536);
    }

    /**
     * See if the color sensor detected a specific color.
     * @param event of color device
     */
    //% blockId=sensor_is_color_event_generate block="color|%event|was triggered"
    //% weight=97 blockGap=8
    //% advanced=true
    export function wasColorTriggered(event: ColorEvent): boolean {
        let eventValue = event;
        if (driver.addrBuffer[SensorType.Liner] == 0) onColor(event, () => { });
        if (driver.lastStatus[SensorType.Liner] == eventValue) return true;
        return false;
    }

    /**
     * See if the line follower recognized the position of the line underneath.
     * @param event of liner device
     */
    //% blockId=sensor_is_liner_event_generate block="line position|%event|was triggered"
    //% weight=96 blockGap=8
    //% advanced=true
    export function wasLinePositionTriggered(event: LinerEvent): boolean {
        let eventValue = event;
        if (!initLiner) onLinePosition(event, () => { });
        if (lastLiner == eventValue) return true;
        return false;
    }

    /**
     * Set the servo position by degree.
     * @param degree set the degree you want to move.
     */
    //% blockId=motor_move_servo block="servo move to|%degree|(degree)"
    //% degree.min=0 degree.max=180 degree.defl=0
    //% weight=100 blockGap=8
    export function moveServoTo(degree: number) {
        let data: Buffer = pins.createBuffer(2);
        data[0] = 0x02;
        data[1] = degree;
        driver.i2cSendBytes(0x24, data);
    }

    /**
     * Set the actions and the moving speed of motormodule.
     * @param direction the direction that want to set.
     * @param speed the speed that want to run.
     */
    //% blockId=motor_set_action block="go|%direction|at speed|%speed"
    //% weight=99 blockGap=8
    export function setMotormoduleAction(direction: DirectionTpye, speed: SpeedTpye) {
        let data: Buffer = pins.createBuffer(5);
        data[0] = 0x02;
        data[1] = speed;
        data[2] = direction;
        data[3] = 0;
        data[4] = 0;
        driver.i2cSendBytes(MotorTpye.Wheel, data);
    }

    /**
     * Stop the motormodule.
     */
    //% blockId=motor_stop_run block="stop"
    //% weight=98 blockGap=8
    export function stopMotormodule() {
        setMotormoduleSpeed(0, 0);
    }

    /**
     * Set the speed of motors on motormodule.
     * @param left the left speed you want to run.
     * @param right the right speed you want to run.
     */
    //% blockId=motor_set_speed_with_duty block="set motor speed left|%left|right|%right"
    //% left.min=-255 left.max=255 left.defl=0
    //% right.min=-255 right.max=255 right.defl=0
    //% weight=100 blockGap=8
    //% advanced=true
    export function setMotormoduleSpeed(left: number, right: number) {
        let data: Buffer = pins.createBuffer(5);
        data[0] = 0x01;
        data[1] = left & 0xff;
        data[2] = (left >> 8) & 0xff;
        data[3] = right & 0xff;
        data[4] = (right >> 8) & 0xff;
        driver.i2cSendBytes(MotorTpye.Wheel, data);
    }

    /**
     * Set the actions and the moving speed of motormodule when it lost the line(detected by the line follower).
     * @param motion the motion that want to set.
     * @param speed the speed that want to run.
     */
    //% blockId=motor_when_lost_line block="go|%motion|at speed|%speed|when lost the line"
    //% weight=99 blockGap=8
    //% advanced=true
    export function whenMotormoduleLostLine(motion: MotionTpye, speed: SpeedTpye) {
        if ((motion == MotionTpye.Auto)) {
            if ((sensor.linerEventValue == LinerEvent.Left) || (sensor.linerEventValue == LinerEvent.Leftmost))
                motion = 6; // Anticlockwise
            else if ((sensor.linerEventValue == LinerEvent.Right) || (sensor.linerEventValue == LinerEvent.Rightmost))
                motion = 5; // Clockwise
        }
        else if ((motion == MotionTpye.Random)) {
            let random: number = Math.random(1);
            if (random == 0) motion = 5; // Clockwise
            else if (random == 1) motion = 6; // Anticlockwise
        }

        let data: Buffer = pins.createBuffer(5);
        data[0] = 0x02;
        data[1] = speed;
        data[2] = motion;
        data[3] = 0;
        data[4] = 0;
        driver.i2cSendBytes(MotorTpye.Wheel, data);
    }
}