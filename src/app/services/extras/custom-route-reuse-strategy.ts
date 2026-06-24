import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedHandles = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Cache all routes that have a path config (components)
    return !!route.routeConfig;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const url = this.getUrl(route);
    if (url && handle) {
      this.storedHandles.set(url, handle);
    } else if (url && handle === null) {
      this.storedHandles.delete(url);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const url = this.getUrl(route);
    return !!route.routeConfig && this.storedHandles.has(url);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.routeConfig) return null;
    const url = this.getUrl(route);
    return this.storedHandles.get(url) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  public clearHandle(url: string) {
    const handle = this.storedHandles.get(url);
    if (handle) {
      const componentRef = (handle as any).componentRef;
      if (componentRef) {
        componentRef.destroy();
      }
      this.storedHandles.delete(url);
    }
  }

  private getUrl(route: ActivatedRouteSnapshot): string {
    if (!route.routeConfig) return '';
    let next = route;
    while (next.firstChild) {
      next = next.firstChild;
    }
    const url = '/' + next.pathFromRoot
      .map(v => v.url.map(segment => segment.path).join('/'))
      .filter(Boolean)
      .join('/');
    return url;
  }
}
