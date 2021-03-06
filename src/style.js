import fetch from 'node-fetch';
import WorkspaceClient from './workspace.js';

/**
 * Client for GeoServer styles
 *
 * @module StyleClient
 */
export default class StyleClient {
  /**
   * Creates a GeoServer REST StyleClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Returns all default styles.
   */
  async getDefaults () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'styles.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all styles in a workspace.
   *
   * @param {String} workspace Workspace name to get styles for
   */
  async getInWorkspace (workspace) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/styles.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all styles defined in workspaces.
   */
  async getAllWorkspaceStyles () {
    try {
      const allStyles = [];
      const ws = new WorkspaceClient(this.url, this.user, this.password);
      const allWs = await ws.getAll();

      // go over all workspaces and query the styles for
      for (let i = 0; i < allWs.workspaces.workspace.length; i++) {
        const ws = allWs.workspaces.workspace[i];
        const wsStyles = await this.getInWorkspace(ws.name);

        if (wsStyles.styles.style) {
          wsStyles.styles.style.forEach(wsStyle => {
            allStyles.push(wsStyle);
          });
        }
      }

      return allStyles;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all styles as combined object (default ones and those in
   * workspaces).
   */
  async getAll () {
    try {
      const defaultStyles = await this.getDefaults();
      const wsStyles = await this.getAllWorkspaceStyles();
      const allStyles = defaultStyles.styles.style.concat(wsStyles);

      return allStyles;
    } catch (error) {
      return false;
    }
  }

  /**
   * Publishes a new SLD style.
   *
   * @param {String} workspace The workspace to publish style in
   * @param {String} name Name of the style
   * @param {String} sldBody SLD style (as XML text)
   */
  async publish (workspace, name, sldBody) {
    try {
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/styles?name=' + name, {
        credentials: 'include',
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'application/vnd.ogc.sld+xml'
        },
        body: sldBody
      });

      if (response.status === 201) {
        return true;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
