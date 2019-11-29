const WebSocket = require('ws');
const { startMic } = require('./mic');
const soundEmitter = require('./soundEmitter');
const { Service, MicConfig, SoundSource } = require('./service')

startMic()

exports.createRemoteControl = function createRemoteControl(lightProgram, deviceMultiplexer) {
  const wss = new WebSocket.Server({ port: 8080 });

  const micConfig = new MicConfig({
    sendingMicData: true,
    metric: "Rms"
  });

  const sound = new SoundSource(soundEmitter, micConfig);

  wss.on('connection', function connection(ws) {

    function emit(type, payload) {
      ws.send(JSON.stringify({ type, payload }))
    }

    const service = new Service(lightProgram, deviceMultiplexer, micConfig, emit);

    sound.listen((lastVolumes) => {
      emit('micSample', lastVolumes)
    })

    ws.on('message', function incoming(message) {
      const { type, payload } = JSON.parse(message)

      switch (type) {
        case 'setMicDataConfig':
          service.setMicDataConfig(payload)
          return
        case 'startSamplingLights':
          service.startSamplingLights(payload)
          return
        case 'stopSamplingLights':
          service.stopSamplingLights(payload)
          return
        case 'restartProgram':
          service.restartProgram(payload)
          return
        case 'updateConfigParam':
          service.updateConfigParam(payload)
          return
        case 'setPreset':
          service.setPreset(payload)
          return
        case 'setCurrentProgram':
          service.setCurrentProgram(payload)
          return
      }
    });

    service.connect()

    ws.on('disconnect', () => service.disconnect());

  });
}
