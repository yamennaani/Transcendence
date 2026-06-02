import { Component, inject, signal } from "@angular/core";
import { NgStyle } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { OrgService } from '../../core/services/org-service/org-service';
import { Router } from '@angular/router';
import { DS } from '../../tokens';
import { BtnComponent } from '../../shared/btn.component';

@Component({
  selector: 'app-admin-orgs',
  standalone: true,
  imports: [NgStyle, FormsModule, BtnComponent],
  templateUrl: './orgs.component.html',
  styles: [`:host { display: block; flex: 1; min-height: 0; width: 100%; }`],
})
export class AdminOrgsComponent {
  private orgService = inject(OrgService)
  private router = inject(Router)

  orgs = signal<any[] | null>(null)
  busy = signal(false)
  showNew = signal(false)
  name: string = ''
  email: string = ''
  tag: string = ''
  bio: string = ''
  tel_num: string = ''
  error: string = ''

  constructor(){ this.load() }

  load(){
    this.orgService.getOrgs().subscribe({ next: (d:any)=> this.orgs.set(d), error: ()=> this.orgs.set([]) })
  }

  openDetail(orgId:number){ this.router.navigate([`/admin/org/${orgId}`]) }

  create(){
    const name = this.name.trim()
    const email = this.email.trim()
    const tag = this.tag.trim()
    if(!name || !email || !this.bio || !this.tel_num){ this.error = 'Name, contact email, bio and phone required'; return }
    this.busy.set(true)
    this.orgService.createOrg({ email, orgname: name, tag }).subscribe({
      next: (org:any)=>{ 
        // create org profile after org creation
        this.orgService.createOrgProfile(org.id, { bio: this.bio, tel_num: this.tel_num }).subscribe({
          next: ()=>{
            this.busy.set(false); this.showNew.set(false); this.name = ''; this.email = ''; this.tag = ''; this.bio = ''; this.tel_num = ''; this.load()
          },
          error: ()=>{ this.busy.set(false); this.error = 'Org created but failed to create profile' }
        })
      },
      error: ()=>{ this.busy.set(false); this.error = 'Failed to create org' }
    })
  }

  readonly pageStyle = {
    padding: '32px',
    minHeight: '100%',
    minWidth: '0',
    height: '100%',
    overflowY: 'auto',
    background:
      'radial-gradient(circle at top right, oklch(22% 0.08 296 / 0.35), transparent 32%), radial-gradient(circle at top left, oklch(20% 0.05 200 / 0.28), transparent 28%), linear-gradient(180deg, oklch(11% 0.025 272), oklch(13% 0.025 272))',
    color: DS.colors.fg1,
  }

  readonly shellStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  }

  readonly heroStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '8px 0',
  }

  readonly eyebrowStyle = {
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: DS.colors.cyan,
    marginBottom: '8px',
  }

  readonly titleStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.04em',
    color: DS.colors.fg1,
    margin: '0',
  }

  readonly subtitleStyle = {
    maxWidth: '720px',
    marginTop: '10px',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: DS.colors.fg2,
  }

  readonly statGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px',
  }

  readonly statCardStyle = {
    background: DS.colors.surface,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.lg,
    padding: '18px 20px',
    boxShadow: '0 18px 40px oklch(0% 0 0 / 0.18)',
  }

  readonly statLabelStyle = {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: DS.colors.fg3,
    marginBottom: '8px',
  }

  readonly statValueStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '1.7rem',
    fontWeight: '700',
    color: DS.colors.fg1,
    lineHeight: '1',
  }

  readonly statHintStyle = {
    marginTop: '6px',
    fontSize: '0.8rem',
    color: DS.colors.fg3,
  }

  readonly cardStyle = {
    background: `linear-gradient(180deg, ${DS.colors.surface}, ${DS.colors.surfaceRaised})`,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.xl,
    padding: '18px 20px',
    boxShadow: '0 16px 44px oklch(0% 0 0 / 0.18)',
  }

  readonly emptyStateStyle = {
    border: `1px dashed ${DS.colors.border}`,
    borderRadius: DS.radius.lg,
    background: DS.colors.surface,
    padding: '18px 20px',
    color: DS.colors.fg2,
  }

  readonly tableWrapStyle = {
    background: DS.colors.surface,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    boxShadow: '0 18px 40px oklch(0% 0 0 / 0.18)',
  }

  readonly tableHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1.1fr 0.8fr 0.7fr',
    gap: '12px',
    padding: '14px 20px',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: DS.colors.fg3,
    borderBottom: `1px solid ${DS.colors.borderSubtle}`,
    background: 'oklch(16% 0.025 272)',
  }

  readonly tableRowStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1.1fr 0.8fr 0.7fr',
    gap: '12px',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${DS.colors.borderSubtle}`,
    color: DS.colors.fg2,
  }

  readonly nameStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  readonly orgNameStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '1rem',
    fontWeight: '600',
    color: DS.colors.fg1,
  }

  readonly orgMetaStyle = {
    fontSize: '0.8rem',
    color: DS.colors.fg3,
  }

  readonly pillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: DS.radius.full,
    background: DS.colors.violetSubtle,
    color: DS.colors.violet,
    border: `1px solid ${DS.colors.violetBorder}`,
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    width: 'fit-content',
  }

  readonly inputStyle = {
    background: DS.colors.surfaceRaised,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.md,
    padding: '10px 12px',
    fontSize: '0.9rem',
    fontFamily: DS.fonts.body,
    color: DS.colors.fg1,
    outline: 'none',
    width: '100%',
  }

  readonly labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.04em',
    color: DS.colors.fg2,
    marginBottom: '8px',
  }

  readonly overlayStyle = {
    position: 'fixed',
    inset: '0',
    background: 'oklch(0% 0 0 / 0.74)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '100',
    padding: '24px',
  }

  readonly modalStyle = {
    width: 'min(720px, 100%)',
    background: `linear-gradient(180deg, ${DS.colors.surface}, ${DS.colors.surfaceRaised})`,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.xl,
    boxShadow: '0 28px 64px oklch(0% 0 0 / 0.45)',
    padding: '24px',
  }

  readonly modalTitleStyle = {
    fontFamily: DS.fonts.display,
    fontSize: '1.4rem',
    fontWeight: '700',
    color: DS.colors.fg1,
    margin: '0 0 10px',
  }

  readonly modalHintStyle = {
    color: DS.colors.fg2,
    fontSize: '0.9rem',
    lineHeight: '1.6',
    marginBottom: '18px',
  }

  readonly errorStyle = {
    marginTop: '14px',
    padding: '10px 12px',
    borderRadius: DS.radius.md,
    border: `1px solid ${DS.colors.redBorder}`,
    background: DS.colors.redSubtle,
    color: DS.colors.red,
    fontSize: '0.875rem',
  }
}
