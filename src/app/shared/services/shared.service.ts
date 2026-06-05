import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ViewImageComponent } from '../components/view-image/view-image.component';
import { ViewContentComponent } from '../components/view-content/view-content.component';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    isSidebarOpen: boolean = true;
    isSidebarSlim: boolean = false;
    
    siteConfig: any;
    userData: any;

    get currency(): string {
        return this.siteConfig?.currency || '£';
    }

    deviceWidth: number;
    deviceHeight: number;
    
    currentTheme: 'light' | 'dark' = 'light';

    constructor(private router: Router, private modalservice: NgbModal, private toastr: ToastrService,  @Inject(DOCUMENT) private doc: Document) {
        if (localStorage.getItem('admin_data')) {
            this.userData = JSON.parse(atob(localStorage.getItem('admin_data')));
            console.log('this.userData -->', this.userData);
        }
    }

    logout() {
        localStorage.removeItem('admin_data');
        localStorage.clear;
        this.router.navigate(['/login']);
    }


    showAlert(type: number, title: string, message?: string) {
        if (type == 1) {
            this.toastr.success(title, message ? message : '', {
                enableHtml: true,
                progressBar: true,
                positionClass: 'toast-top-right'
            });
        } else if (type == 2) {
            this.toastr.warning(title, message ? message : '', {
                enableHtml: true,
                progressBar: true,
                positionClass: 'toast-top-right'
            });
        } else if (type == 3) {
            this.toastr.error(title, message ? message : '', {
                enableHtml: true,
                progressBar: true,
                positionClass: 'toast-top-right'
            });
        } else if (type == 4) {
            this.toastr.info(title, message ? message : '', {
                enableHtml: true,
                progressBar: true,
                positionClass: 'toast-top-right'
            });
        }
    }

    viewContent(data) {
        const modalRef = this.modalservice.open(ViewContentComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = data;
    }
    viewImage(data) {
        const modalRef = this.modalservice.open(ViewImageComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = data;
    }
    copyText(val: string) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);
        document.getElementById('copy-data-text').innerHTML = 'Copied!';
    }
    openURL(url) {
        window.open(url, '_blank');
    }

    
    shareUrlToSocial(platform_name, url) {
        let shareUrl = '';

        switch (platform_name.toLowerCase()) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
                break;
            case 'reddit':
                shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=Check this out!`;
                break;
            default:
                this.showAlert(2, 'Unsupported Platform');
                return;
        }

        window.open(shareUrl, '_blank');
    }
    async UploadFile(directory, dimentions?, type?): Promise<any | null> {
        const modalRef = this.modalservice.open(FileUploadComponent, {
            size: 'md',
            backdrop: 'static',
            centered: true,
        });
        modalRef.componentInstance.directory = directory;
        if (dimentions) {
            modalRef.componentInstance.dimentions = dimentions;
        }
        if (type) {
            modalRef.componentInstance.type = type;
        }

        try {
            const result = await modalRef.result;
            if (result && result.status) {
                return { url: result.url, fileId: result.fileId };
            }
            return null;
        } catch (error) {
            console.error('Modal dismissed or an error occurred:', error);
            return null;
        }
    }

    toggleSidebarSlim() {
        this.isSidebarSlim = !this.isSidebarSlim;
        sessionStorage.setItem('isSidebarSlim', this.isSidebarSlim ? '1' : '0');
    }
    toggleTheme() {
        this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    }

    setTheme(theme: 'light' | 'dark') {
        this.currentTheme = theme;
        if (this.doc && this.doc.documentElement) {
            this.doc.documentElement.setAttribute('data-theme', theme);
        }
        sessionStorage.setItem('theme', theme);
    }
}