// src/lib/deepgramStream.ts

export class DeepgramStreamManager {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private onFinalTranscript: (text: string) => void;
  private stream: MediaStream | null = null;

  constructor(onFinalTranscript: (text: string) => void) {
    this.onFinalTranscript = onFinalTranscript;
  }

  public async start(apiKey: string) {
    if (this.socket || this.mediaRecorder) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connexion au WebSocket de Deepgram
      // model=nova-2 (le plus rapide), language=fr (pour commencer), interim_results=true (pour voir le texte en cours)
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&interim_results=true&endpointing=300`;
      
      this.socket = new WebSocket(wsUrl, ['token', apiKey]);

      this.socket.onopen = () => {
        console.log("Deepgram WebSocket Open - Ready to Listen");
        
        // Envoi par chunk de 250ms (Ultra-rapide)
        this.mediaRecorder = new MediaRecorder(this.stream as MediaStream, { mimeType: 'audio/webm' });
        
        this.mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && this.socket?.readyState === 1) {
            this.socket.send(event.data);
          }
        });

        this.mediaRecorder.start(250); 
      };

      this.socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0].transcript;
        
        // Si c'est vide, on ignore
        if (!transcript) return;

        // PRIORITÉ : Si Deepgram dit que la phrase est finie (is_final ou speech_final)
        if (received.is_final || received.speech_final) {
           console.log("Phrase terminée (Envoi à l'IA) :", transcript);
           this.onFinalTranscript(transcript);
        } else {
           // Pour l'interface utilisateur, on affiche juste la progression
           console.log("En cours :", transcript);
        }
      };

      this.socket.onerror = (error) => {
        console.error("Deepgram WebSocket Error", error);
      };

      this.socket.onclose = () => {
        console.log("Deepgram WebSocket Closed");
        this.stop();
      };

    } catch (err) {
      console.error("Erreur Initialisation Micro/Deepgram", err);
    }
  }

  public stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.socket) {
      this.socket.close();
    }
    this.mediaRecorder = null;
    this.socket = null;
    this.stream = null;
  }
}
