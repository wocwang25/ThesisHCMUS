import React from 'react';

export const DocsPage: React.FC = () => {
  return (
    <div className="docs-w fup">
      <aside className="docs-sb">
        <h6>Introduction</h6>
        <a href="#welcome" className="act">Welcome</a>
        <a href="#architecture">Architecture</a>

        <h6>Gateway Endpoints</h6>
        <a href="#health">/api/health</a>
        <a href="#upload">POST /jobs</a>
        <a href="#job">GET /jobs/:jobId</a>
        <a href="#result">GET /result</a>

        <h6>Realtime</h6>
        <a href="#socket">Socket.IO</a>
      </aside>

      <div className="docs-ct">
        <h1 className="docs-ttl" id="welcome">API Documentation</h1>
        <p className="docs-p">
          This VieTrans interface is wired to the current ThesisHCMUS async gateway.
          The browser uploads an image to Express, the gateway creates a MongoDB job,
          RabbitMQ dispatches it to the worker, and the UI polls the result endpoint.
        </p>

        <h3 className="docs-h3" id="architecture">Architecture</h3>
        <div className="code">
          Web UI → Node.js Gateway → MongoDB Atlas<br />
          Gateway → RabbitMQ request queue → Python Worker<br />
          Worker → RabbitMQ completion queue → Gateway → Result image
        </div>

        <h3 className="docs-h3" id="health">Health — <span className="ep-m g">GET</span></h3>
        <div className="ep">
          <span className="ep-m g">GET</span>
          <div>
            <div className="ep-path">/api/health</div>
            <div className="ep-desc">Checks whether the Node.js gateway is reachable.</div>
          </div>
        </div>

        <h3 className="docs-h3" id="upload">Create Image Translation Job — <span className="ep-m p">POST</span></h3>
        <p className="docs-p">Submit an image for asynchronous English-to-Vietnamese in-image translation.</p>

        <div className="ep">
          <span className="ep-m p">POST</span>
          <div>
            <div className="ep-path">/api/image-translations/jobs</div>
            <div className="ep-desc">Multipart Form Data · Required field: `image`</div>
          </div>
        </div>

        <div className="code">
          <span className="cc"># Example request with curl</span><br />
          curl -F <span className="cs">"image=@sample.png"</span> \<br />
          &nbsp;&nbsp;<span className="cs">"http://localhost:3000/api/image-translations/jobs"</span>
        </div>

        <h3 className="docs-h3" id="job">Read Job Status — <span className="ep-m g">GET</span></h3>
        <div className="ep">
          <span className="ep-m g">GET</span>
          <div>
            <div className="ep-path">/api/image-translations/jobs/:jobId</div>
            <div className="ep-desc">Returns queued, processing, completed, or failed.</div>
          </div>
        </div>

        <h3 className="docs-h3" id="result">Result Image — <span className="ep-m g">GET</span></h3>
        <div className="ep">
          <span className="ep-m g">GET</span>
          <div>
            <div className="ep-path">/api/image-translations/jobs/:jobId/result</div>
            <div className="ep-desc">Returns the generated image when the job is completed.</div>
          </div>
        </div>

        <h3 className="docs-h3">Response Schema</h3>
        <div className="code">
          {'{'}<br />
          &nbsp;&nbsp;<span className="jk">"jobId"</span>: <span className="cs">"uuid"</span>,<br />
          &nbsp;&nbsp;<span className="jk">"status"</span>: <span className="cs">"queued | processing | completed | failed"</span>,<br />
          &nbsp;&nbsp;<span className="jk">"originalName"</span>: <span className="cs">"sample.png"</span>,<br />
          &nbsp;&nbsp;<span className="jk">"resultUrl"</span>: <span className="cs">"/api/image-translations/jobs/uuid/result"</span>,<br />
          &nbsp;&nbsp;<span className="jk">"error"</span>: <span className="cs">null</span><br />
          {'}'}
        </div>

        <h3 className="docs-h3" id="socket">Socket.IO Event</h3>
        <div className="code">
          socket.emit(<span className="cs">"image-translation:join-job"</span>, jobId)<br />
          socket.on(<span className="cs">"image-translation:job-update"</span>, callback)
        </div>
      </div>
    </div>
  );
};
