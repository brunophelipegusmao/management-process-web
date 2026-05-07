import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from "./hero/hero";
import { Container } from "../../components/shared/container/container";
import { Contact } from "../contact/contact";
import { TextSection } from "./text-section/text-section";
import { Footer } from "../../components/shared/footer/footer";

@Component({
  selector: 'app-home',
  imports: [Hero, Container, Contact, TextSection, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
